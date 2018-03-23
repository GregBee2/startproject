var fs = require('fs');
var path= require('path')
var clone = require('git-clone');
var { array }=require('@xassist/xassist-array')
var os=require("os");
var  { exec } = require('child_process');

var queue=[];
var currentStep=-1;
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

module.exports.init=function(options){

	var basePath=path.join(process.cwd(),options.folderName||"");
	if(options.preScripts){
		options.preScripts.forEach(function(s){
			queue.push(runScript.bind(null,s,process.cwd()));
		});
	}
	if(options.git){
		queue.push(cloneGIT.bind(null,options.git,basePath));
	}
	else{
		queue.push(createFolder.bind(null,basePath));
	}
	var folders=options.folders||[];
	folders.forEach(function(x){
		queue.push(createFolder.bind(null,path.join(basePath,x)));
	})
	var files=options.files||[];
	files.forEach(function(x){
		var filePath=basePath;
		if (x.folder &&  ~folders.indexOf(x.folder)){
			filePath=path.join(filePath,x.folder)
		}
		else if(!~folders.indexOf(x.folder) && x.folder!==""){
			console.warn("folder specified in files does not exist in folders");			
		}
		filePath=path.join(filePath,x.name);
		if(x.copyFrom){
			queue.push(copyFile.bind(null,filePath,x.copyFrom));
		}
		else{
			queue.push(createFile.bind(null,filePath));
			if(x.content){
				queue.push(writeFile.bind(null,filePath,x.content));
			}
			else if(x.templateFrom){
				queue.push(templateFromFile.bind(null,filePath,x.templateFrom,options));
			}
		}
	})
	var testFile=basePath;
	if(options.hasOwnProperty("testFunctions") && options.testFunctions.length){
		if(~folders.indexOf("test")){
			testFile=path.join(testFile,"test");
		}
		testFile=path.join(testFile,options.testFile||"main-test.js");
		queue.push(createFile.bind(null,testFile));
		queue.push(createtest.bind(null,testFile,options.testFunctions));
	}
	if(options.postScripts){
		options.postScripts.forEach(function(s){
			queue.push(runScript.bind(null,s,basePath));
		});
	}
	runQueue();
}

function runQueue(){
	currentStep++;
	if(currentStep<queue.length){
		queue[currentStep]();
	}
	else{
		success();
	}
}
function stopQueue(message,){
	queue=[];
	stop(message||"error-execution stopped");
}

function runScript(script,basePath){
	console.log('executing script: '+script);
	var cmds=script.split(" ");
	script=(cmds[0]==="npm"?"npm.cmd":cmds[0])+" "+cmds.slice(1).join(" ");
	var child=exec(script,{cwd:basePath,detached:true,stdio:'ignore'})/*,function(err,stdout,stdin){
		 if (err) {
			stopQueue("error executing script - code:"+err);
		  }
		  else{
			  console.log('script executed: '+script);
			  console.log("[[stdin]]: "+stdin) 
			  console.log("[[stdout]]: "+stdout) 
			  runQueue();
		  }
	})*/
	
	child.stdin.end();
	/*child.stderr.on('data', (data) => {
	  console.log(`stderr: ${data}`);
	  stopQueue("error executing script - data:"+data);
	  child.stdout.destroy();
		//child.stderr.destroy();
		child.stdin.destroy();
		//process.kill(child.pid);
	});*/
	child.on('error', function(err) {
		stopQueue("error executing script "+script);
	})
	child.stdout.on('data', (data) => {
	  console.log(`stdout: ${data}`);
	});
	child.on('exit', function(code) {
		child.stdout.destroy();
		child.stderr.destroy();
		child.stdin.destroy();
		//process.kill(child.pid);
		console.log("ended");
		if (code!=0) {
			stopQueue("error executing script - code:"+code);
		}
		else{
		  runQueue();
		}
		

	})
}
function createFile(newFile){
	fs.open(newFile, "wx", function (err, fd) {
		// handle error
		if(err){
			stopQueue("error creating file:"+err.message);
		}
		else{
			fs.close(fd, function (err) {
				if(err){
					stopQueue("error creating file:"+err.message);
				}
				else{
					console.log("file created: "+newFile);
					runQueue();
				}
			});
		}
	});
}
function createtest(testFile,testFunctions){
	var content=[];
	content.push("var definition = require(\"../package.json\");");
	content.push("var main =require(\"../\"+definition.main);");
	content.push("var tape=require(\"tape\");");
	content.push("");
	testFunctions.forEach(function(t,i){
		content.push("tape(\""+t+"(): test_"+i+"\", function(test){");
		content.push("\ttest.ok(true,");
		content.push("\t\t\""+t+"() WORKS\");");
		content.push("\ttest.end();");
		content.push("});");
	})
	console.log("creating testfile");
	writeFile(testFile,content.join(os.EOL));
	
};
function writeFile(newFile,content){
	fs.appendFile(newFile, content, function (err) {
	  if (err) {
		// append failed
		stopQueue("error writing to file:"+err.message);
	  } else {
		// done
		console.log("file written: "+newFile);
			runQueue();
	  }
	})
}
function templateFromFile(newFile,templateFile,options){
	console.log("reading templates for "+newFile);
	fs.readFile(templateFile, {encoding: 'utf-8'}, function(err,data){
		if (!err) {
			writeFile(newFile,template(data.toString(),options));
		} else {
			console.log(err);
			stopQueue("error reading template from file:"+err.message);
		}
	});
}

function copyFile(target, source) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cbCalled = true;
	  if(!err){
		  console.log("file copied: "+source);
		runQueue();
	  }
	  else{
		  stopQueue("error while copying file:"+err.message);
	  }
    }
  }
}


function cloneGIT(gitURL,folder){
	clone(gitURL, folder, function(error){
		if(!error){
			console.log("git cloned");
			runQueue();
		}
		else{
			stopQueue("error while cloning git");
		}
	
	});
}

function createFolder(folderPath){
		fs.mkdir(folderPath,function(err){
			if(err){
				stopQueue("error creating folder:"+err.message)
			}
			else{
				 console.log("folder created "+folderPath);
				runQueue()
			}
		})
}

function stop(message){
	console.log("stopped execution");
	console.log(message);
}
function success(){
	console.log("execution finished successfully");
}