/**
 * Проект предназначен для генерации иллюстративного материала о содержимом JSON схемы
 * Иллюстративный материала предполагается использовать в документации на систему
 */

const JsonSchemaParser = require('./JsonSchemaParser.js');


Main();

async function Main() {

var inputFile = "./DATA/DT.schema.json";
var outputFile = "./DATA/output.txt";


var parsedJSData = JsonSchemaParser.GetJSData(inputFile);

console.log("Main Done");




}



