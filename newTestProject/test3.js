{
  "name": "@xassist/testProject",
  "version": "0.0.1",
  "description": "load csv files from remote and create csv files",
  "keywords":["keyword1","keyWord2"],
  "bugs": {
    "email": "gregory.beirens@gmail.com"
  },
  "license": "GPL-3.0",
  "author": {
		"name": "Gregory Beirens",
		"email": "gregory.beirens@gmail.com"
	},
  "main": "dist/testProject.js",
  "module": "index",
  "scripts": {
    "pretest": "rimraf dist  && rollup -c",
    "test": "istanbul cover node_modules/tape/bin/tape test/**/*-test.js && eslint index.js src",
    "posttest": "npm run uglify",
    "build": "npm run test && git commit -am ",
    "prepublishOnly": "npm version patch && npm run build  -- \"publish latest version\"",
    "postpublish": "git push && git push --tags",
	"readme":"node csv2readme.config.js",
    "uglify": "uglifyjs  --comments /^@preserve/ dist/testProject.js -c -m -o dist/testProject.min.js"
  },
  "devDependencies": {
    "csv2readme": "^1.0.1",
    "rimraf": "^2.6.2",
    "rollup": "^0.56.3",
    "tape": "^4.9.0"
  },
  "dependencies": {
  },
  "repository": {
    "type": "git",
    "url": "git+"
  },
  "homepage": "",
  "directories": {
    "test": "test"
  }
}
