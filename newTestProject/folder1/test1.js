var csv2readme = require('csv2readme');

var options={
	input:{
		base:"../../helpData/csv/base.csv",
		functionParam:"../../helpData/csv/functionParameters.csv",
		classDef:"../../helpData/csv/classDefinition.csv"
	},
	moduleName:"${miscTemplates.moduleName}",
	globalTOC:false,
	header:{
		title:"${name}",
		explanation:${miscTemplates.description}
	},
	headerFiles:["../../helpData/markdown/installationModule.md"],
	includeDependencies:true,
	includeLicense:true,
	footerFiles:[],
	subTitle:"API",
	output:{
		file:"README.md"
	},
	baseLevel:3,
	headerTemplates:{
		moduleName:"${miscTemplates.moduleName}",
		moduleUrl:"${git},
		libraryName:"${miscTemplates.libraryName}",
		libraryUrl:"${miscTemplates.libraryUrl}",
		moduleTest:"${miscTemplates.moduleTest}"
	},
	footerTemplates:{
	}
};
csv2readme.init(options);