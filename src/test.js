var startproject = require('./startproject.js');

var options={
	name:"@xassist/testProject",
	folderName:"newTestProject",
	mail:"gregory.beirens@gmail.com",
	authorName:"Gregory Beirens",
	/*git:"https://github.com/GregBee2/xassist-object.git",*/
	
	folders:["test",'folder1'],
	files:[
		{name:"test1.js",folder:"folder1",copyFrom:"src/csv2readme.config.template"},
		{name:"test2.js",folder:"test",content:"test\r\nhello hopelijk lukt dit"},
		{name:"test3.js",folder:"",templateFrom:"./package.template"},
	],
	testFunctions:["function1","function2"],
	testFile:"main-test.js",
	scripts2Run:[
		
		"echo 'test done'"	,
		"npm -version"		
	],
	miscTemplates:{
		description:"load csv files from remote and create csv files",
		moduleTest:"csv()",
		moduleName:'testProject',
		libraryName:"@xassist",
		libraryUrl:"https://github.com/GregBee2/xassist",
		keywords:JSON.stringify(["keyword1","keyWord2"])
	}
};
startproject.init(options);

	
	