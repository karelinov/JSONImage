/**
 * Проект предназначен для генерации иллюстративного материала о содержимом JSON схемы
 * Иллюстративный материала предполагается использовать в документации на систему
 */

const jsp = require('./JsonSchemaParser.js');
const htp = require('./HTMLTableProducer.js');
const fs = require('node:fs/promises');


/*
var x = {};
console.log(x);   
console.log("x != null "+(x != null));   
console.log("!(x != null) "+(!(x != null)));   
console.log("x == null "+(x == null));   
console.log("x !== null "+(x !== null));   
console.log("!(x == null) "+(!(x == null)));   
*/

Main();


async function Main() {

var inputFile = "./DATA/IN/DT.schema.json";
var outputJSNodeFile = "./DATA/OUT/output.json";
var outputHTMLFile = "./DATA/OUT/output.html";


var jsdataResult = await jsp.GetJSData(inputFile);
if (jsdataResult.result)
    console.log("GetJSData Done");
else 
    throw new Error("GetJSData ERROR: "+jsdataResult.resultObject);    
var jsNode = jsdataResult.resultObject;

var htpResult = await htp.GetHTMLForNode(jsNode);
if (htpResult.result)
    console.log("GetHTMLForNode Done");
else 
    throw new Error("GetHTMLForNode ERROR: "+htpResult.resultObject);    


await fs.writeFile(outputJSNodeFile, JSON.stringify(jsNode));
console.log("Written "+outputJSNodeFile);
await fs.writeFile(outputHTMLFile, htpResult.resultObject);
console.log("Written "+outputHTMLFile);


console.log("Main Done");




}



