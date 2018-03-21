var csv2readme = require('./csv2readme.js');
const definition = require("../package.json");

var options={
	input:{
		base:"data/base.csv",
		functionParam:"data/functionParameters.csv",
		classDef:"data/classDefinition.csv"
	},
	moduleName:"xassist",
	globalTOC:true,
	baseURL:"https://github.com/GregBee2/",
	header:{
		title:"xassist",
		explanation:["Several helper functions for Array's, objects, events, Dates, ..."].join("\r\n")
	},
	headerFiles:["src/installationModule.md"],
	includeDependencies:true,
	includeLicense:true,
	footerFiles:[/*"dependencies.md","src/license.md"*/],
	subTitle:"API",
	output:{
		file:"src/TOC.md"
	},
	baseLevel:3,
	headerTemplates:{
		moduleName:"xassist",
		moduleUrl:"https://raw.githubusercontent.com/GregBee2/xassist/master/dist/xAssist.min.js",
		libraryName:"xassist",
		libraryUrl:"https://github.com/GregBee2/xassist",
		moduleTest:"version()"
	},
	footerTemplates:{
		/*license:definition.license,
		licenseUrl:"https://choosealicense.com/licenses/"+definition.license.toLowerCase()*/
	}
};
csv2readme.init(options);

	
	