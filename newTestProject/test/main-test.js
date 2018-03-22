var definition = require("../package.json");
var main =require("../"+definition.main);
var tape=require("tape");

tape("function1(): test_0", function(test){
	test.ok(true,
		"function1() WORKS");
	test.end();
});
tape("function2(): test_1", function(test){
	test.ok(true,
		"function2() WORKS");
	test.end();
});