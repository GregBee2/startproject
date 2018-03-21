var { csv } =require("@xassist/xassist-csv")
var fs = require('fs');
var path= require('path')
var pckPath=path.join(process.cwd(),"package.json");
var definition=require(pckPath);
var { array }=require('@xassist/xassist-array')


fs.readFileAsync = function(filename) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filename, function(err, data){
            if (err) 
                reject(err); 
            else 
                resolve(data);
        });
    });
};
function template(text,obj,notfoundText){
	notfoundText=(notfoundText?notfoundText:"");
	return text.replace(/\${([^}]*)}/g,function(match,p1){
		
		return p1.split(".").reduce(function(obj,prop){
			if(obj.hasOwnProperty(prop)){
				return obj[prop];
			}
			return notfoundText;
		},obj);
	});
}
function createLicense(license,level){
	var url=function(lic){
			return "https://choosealicense.com/licenses/"+lic.toLowerCase()
	}
	result=[];
	result.push(getHeaderPrefix(level)+"License")
	result.push("");
	result.push("This module is licensed under the terms of ["+license+"]("+url(license)+").")
	result.push("")
	return result
}
function createDeps(deps,devDeps,level){
	var result=[];
	
	if(Object.keys(deps).length){
		result.push(getHeaderPrefix(level)+"Dependencies");
		Object.keys(deps).forEach(function(dep){

			var pkgPath=path.join(process.cwd(),"node_modules",dep,"package.json");
			//console.log(pkgPath)
			var pkg=require(pkgPath);
			result.push("- ["+dep+"]("+pkg.homepage+")"+(pkg.description?": "+pkg.description:""));
		})
		console.log(result);
	}
	if(Object.keys(devDeps).length){
		result.push(getHeaderPrefix(level)+"DevDependencies");

		Object.keys(devDeps).forEach(function(dep){
			var pkgPath=path.join(process.cwd(),"node_modules",dep,"package.json");
			console.log(pkgPath)
			var pkg=require(pkgPath);
			result.push("- ["+dep+"]("+pkg.homepage+")"+(pkg.description?": "+pkg.description:""));
		})
	}
	return result.concat([""]);
}


module.exports.init=function(options){
	var files=options.input;
	var results={
		base:[],
		functionParam:[],
		classDef:[]
	}
	options.baseLevel=(typeof options.baseLevel==="number"?options.baseLevel:2)
	openFiles(files).then(function(contentArray){
		var MD,prefix="",txtToSave,txtBefore=[],txtAfter=[],deps=[],license=[];
		if(contentArray[0]){
			results.base=processFile(contentArray[0].toString('utf8'))
		}
		if(contentArray[1]){
			results.functionParam=processFile(contentArray[1].toString('utf8'))
		}
		if(contentArray[2]){
			results.classDef=processFile(contentArray[2].toString('utf8'))
		}
		//console.log(results);
		if(!options.globalTOC){
			MD=createMD(results,options.moduleName,options.baseLevel);
		}
		else{
			MD=createTOC(results,options.baseURL,options.baseLevel);
		}
		if(options.header){
			prefix=[];
			if(options.header.title){
				prefix.push("# "+options.header.title);
			}
			if(options.header.explanation){
				prefix.push(options.header.explanation);
			}
			prefix=prefix.join('\r\n')+(prefix.length?"\r\n":"");
		}
		if(options.headerFiles){
			txtBefore=options.headerFiles.map(function(file) {
				var contents = fs.readFileSync( file, 'utf8');
				return contents.toString('utf8')+"\r\n";
			});
			if(txtBefore.length){
				txtBefore.push("");
			}
			if(options.headerTemplates){
				txtBefore=txtBefore.map(txt=>template(txt,options.headerTemplates));
			}
			
		}
		if(options.footerFiles){
			txtAfter=options.footerFiles.map(function(file) {
				var contents = fs.readFileSync( file, 'utf8');
				return contents.toString('utf8')+"\r\n";
			});
			if(txtAfter.length){
				txtAfter.push("");
			}
			if(options.footerTemplates){
				txtAfter=txtAfter.map(txt=>template(txt,options.footerTemplates));
			}
		}
		if(options.includeDependencies){
			deps=createDeps(definition.dependencies||{},definition.devDependencies||{},options.baseLevel-1);
		}
		if(options.includeLicense&&definition.license!==""){
			license=createLicense(definition.license,options.baseLevel-1);
		}
		
		txtToSave=prefix+txtBefore.join("\r\n");
		txtToSave+=(options.subTitle?getHeaderPrefix(options.baseLevel-1)+options.subTitle+"\r\n":"");
		
		txtToSave+=MD.join("\r\n")+("\r\n");
		
		txtToSave+=txtAfter.join("\r\n")
		txtToSave+=deps.join("\r\n")+license.join("\r\n");
		
		if(options.output.file){
			fs.writeFile(options.output.file,txtToSave, "utf8",function(){
				console.log("file Saved")
			})
		}
		else{
			console.log(MD.join("\r\n"))
		}
	},function(err){
		throw err;
	})
	
}
function getHeaderPrefix(level){
	
	var res="";
	for (var i=0;i<level;i++){
		res+="#"
	}
	return res+" ";
}
function createTOC(contentObj,baseURL,baseLevel){
	var getAnchorLink=function(txt){
		return txt.trim().toLowerCase().replace(/[^\w\- ]+/g, '').replace(/\s/g, '-').replace(/\-+$/, '');
	}
	var result=[];
	var linksArray=contentObj.base.map(function(v){
		return [v.parent,v.element,baseURL+v.parent,getAnchorLink(v.element)]
	})
	linksArray=array(linksArray).groupSequence(function(a,b){return a[0]===b[0]})
	linksArray.forEach(function(v){
		result.push("- [**"+v[0][0]+"**]("+v[0][2]+")");
		result=result.concat(v.map(x=>"  - ["+x[1]+"]("+x[2]+"#"+x[3]+")"));
	})
	return result
}
function createMD(contentObj,parent,baseLevel){
	var result=[];
	var params=false,resultElem=false,exampleSection=false;
	var baseObjects=contentObj.base.filter(function(obj){
		return obj.parent===parent;
	});
	
	
	var currentElm;
	for(let i=0,len=baseObjects.length;i<len;i++){
		currentElm=baseObjects[i].element;
		result.push(getHeaderPrefix(baseLevel)+baseObjects[i].element);
		result.push("");
		result.push(baseObjects[i].explanation);
		if(baseObjects[i].code){ result.push("```js\r\n"+baseObjects[i].code+"\r\n```");}
		if(baseObjects[i].remark){ result.push(baseObjects[i].remark);}
		params=retrieveParamSection(contentObj.functionParam,currentElm,baseLevel+1);
		resultElem=retrieveResultSection(baseObjects[i].result,baseObjects[i].resultType,currentElm,contentObj,baseLevel+1);
		exampleSection=retrieveExampleSection(baseObjects[i],currentElm,contentObj,baseLevel+1);
		if(!params) {
			result.push("`"+currentElm+"` requires no parameters.")
		}
		if(!resultElem){
			result.push("`"+currentElm+"` returns nothing.")
		}
		if(params){
			result=result.concat(params)
		}
		if(resultElem){
			result=result.concat(resultElem)
		}
		if(exampleSection){
			result=result.concat(exampleSection)
		}		
	}
	return result;
}
function retrieveExampleSection(attr,element,tree,level){
	var result=[getHeaderPrefix(level)+"Example for "+element];
	
	if(attr.exampleInit){
		result.push("Suppose following initialization:")
		result.push("```js")
		result.push(attr.exampleInit);
		result.push("```")
	}
	if(attr.exampleCode){
		result.push("```js")
		result.push(attr.exampleCode);
		result.push("```")
	}
	if(attr.exampleResult){
		result.push("This will result in:")
		result.push("```js")
		result.push(attr.exampleResult);
		result.push("```")
	}
	if(result.length>1){
		return result
	}
	return false
}
function retrieveResultSection(resultText,resultType,element,tree,level){
	var classElems={
			methods:tree.classDef.filter(function(row){
				return row["class"]===resultType && (row.propertyType==="method"||row.propertyType==="function");
			}),
			attributes:tree.classDef.filter(function(row){
				return row["class"]===resultType && (row.propertyType!=="method"&&row.propertyType!=="function");
			})
	}
	
	var result=[getHeaderPrefix(level)+"Result for "+element];
	if(!resultText&&!resultType){
		return false
	}
	if(resultText && !resultType){
		result.push(resultText)
		return result
	}
	else{
		if (resultText){
			result.push(resultText)
		}
		else {
			result.push("`"+element+"` returns a new class instance of the Class `"+resultType+"`");
			result.push("```js")
			result.push(element.replace("()","(a)")+".constructor.name===\""+resultType+"\"");
			result.push("```")
			
		}
		if (classElems.methods.length){
			result.push("`"+resultType+"` returns "+classElems.methods.length+" method:");
			result=result.concat(classElems.methods.map(
				function(attr){
					var aRes="- ";
					aRes+= "`"+attr.property+"`";
					aRes+= ": "+attr.explanation;
					return aRes
				}
			));
		}
		else{
			result.push("`"+resultType+"` has no defined methods.");
		}
		result.push("");
		if (classElems.attributes.length){
			result.push("`"+resultType+"` has "+classElems.attributes.length+" own attributes:");
			result=result.concat(classElems.attributes.map(
				function(attr){
					var aRes="- ";
					aRes+= "`"+attr.property+"`["+(attr.propertyType?"`"+attr.propertyType+"`":"*unknown datatype*")+"]";
					aRes+= ":"+attr.explanation;
					return aRes
				}
			));
			
		}
		else{
			result.push("`"+resultType+"` has no own attributes.");
		}
		return result;
	}
	return false
}

function retrieveParamSection(obj,element,level){
	var objF=obj.filter(function(row){
		return row["function"]===element && row.parameterName;
	});
	var result=[getHeaderPrefix(level)+ "Parameters for "+element];
	result.push("`"+element+"` takes "+ objF.length +" parameters:");
	if (objF.length){
		result=result.concat( objF.map(function(val){
			var resultTxt="- ";
			if(val.optional&&val.optional.toLowerCase()==="true"){
				resultTxt+="*"+val.parameterName+"* ";
			}
			else{
				resultTxt+="**"+val.parameterName+"** ";
			}
			resultTxt+="["+(val.parameterType?"`"+val.parameterType+"`":"*any datatype*")+(val.defaultValue?",defaults to: `"+val.defaultValue+"`":"")+"]";
			resultTxt+=":"+val.explanation;
			return resultTxt;
		}))
		return result;
	}
	return false
}
function processArguments(args){
	var result={
		base:false,
		functionParam:false,
		classDef:false
	}
	result.base=args[0]||false
	result.functionParam=args[1]||false
	result.classDef=args[2]||false
	return result;
}
function openFiles(files){
	var promises=[]
	if(files.base){
		promises.push(getFile(files.base));
	}
	if(files.functionParam){
		promises.push(getFile(files.functionParam));
	}
	if(files.classDef){
		promises.push(getFile(files.classDef));
	}
	return Promise.all(promises);

}
function getFile(file){
    return fs.readFileAsync(file);
}

function processFile(content) {
	return csv({headersIncluded :true}).toObject(content).result;
}
