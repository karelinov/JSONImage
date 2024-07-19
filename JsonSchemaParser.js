/**
 * Модуль с функциями разбора структуры JSON схемы
 */

const JSRP = require('@apidevtools/json-schema-ref-parser');
const jsnode = require('./JSNode.js');


/**
 * Функция возвращает JSON - структуру схемы, содержащую только аспекты, которые будут отображаться на иллюстрации
 * @param {string} inputFile имя разбираемого файла
 * @returns {json} JSON структура
 */
exports.GetJSData = async function GetJSData(inputFile) {
    var dereferencedJSONSchema = await GetFlatFile(inputFile);

    var currentLevel = 1;
    var currentNode = dereferencedJSONSchema; // текущий узел устанавливаем корнем схемы - там предполагаем наличие элемента "type": "object|array"
    var jsNode =TraverseSchema(currentLevel, currentNode);
    console.log(JSON.stringify(jsNode));

    return jsNode;
}

/**
 * Функция переделывает файл JSON схемы, заменяя $ref на определения используя библиотеку json-schema-ref-parser 
 * @param {string} inputFile 
 * @returns {json} JSON схема без $ref, пригодная для прямого прохода по ней
 */
async function GetFlatFile(inputFile) {

  var inputJSONSchema = require(inputFile);
  console.log("импортирован входящий файл "+inputFile);
  console.log(inputJSONSchema);

  var parsedJSONSchema = await JSRP.parse(inputJSONSchema);
  console.log("JSRP.parse done " + parsedJSONSchema);

  var resolvedJSONSchema = await JSRP.resolve(parsedJSONSchema);
  console.log("JSRP.resolve done " + resolvedJSONSchema);

  var dereferencedJSONSchema = await JSRP.dereference(parsedJSONSchema);
  console.log("JSRP.dereference done " + dereferencedJSONSchema);


  return dereferencedJSONSchema;
}

/**
 * Функция рекурсивного обхода структуры JSON schema
 * @param {int} currentlevel текущий уровень вложенности относительно корня
 * @param {*} currentNode текущий узел, по элементам которого надо пройти 
 * @param {*} parentNode  род узел TBD
 */
function TraverseSchema(currentlevel, currentNode, parentNode = null) {
    var parentNodeName = "";

    /** @type {jsnode.JSNode} */
    var jsNode = new jsnode.JSNode();

    if (currentNode.type && currentNode.type === "object") { // для obejct потребуется двигаться глубже
      console.log("-".repeat(currentlevel)+currentNode+" object ");
      jsNode.schemaComposition = "OBJECT";

      // проходимся по дочерним узлам в properties
      let properties = currentNode.properties;
      if (currentNode.properties) {
        for (let key in currentNode.properties) {
          if (key) {
            let childNode = properties[key];
            let childJSNode = TraverseSchema(currentlevel + 1, childNode, currentNode);
            jsNode.children.push(childJSNode);
          }
        }
      }
    }
    else if (currentNode.type && currentNode.type === "array") { // для array потребуется двигаться глубже
      console.log("-".repeat(currentlevel)+currentNode+" array ");
      jsNode.schemaComposition = "ARRAY";

      let curNode = currentNode.items;
      let key = null
      let childJSNode = TraverseSchema(currentlevel + 1, curNode, currentNode);
      jsNode.children.push(childJSNode);

    }
    else {// для прочих/примитивных типов считаем, что достигли "дна" данной ветки - печатаем результат и возврат
      jsNode.schemaComposition ="FIELD";

      if (currentNode.type) {
        if (typeof(currentNode.type) ==="string")
          jsNode.fieldType = currentNode.type;
        else if (Array.isArray(currentNode.type))   
          jsNode.fieldType = currentNode.type[0];
        else 
          jsNode.fieldType = "type unknown "+currentNode.type;
      }   
      else
        jsNode.fieldType = "type undefined";

      if(currentNode.type ==="string" && currentNode.format)
        jsNode.fieldFormat = currentNode.format;

      console.log("-".repeat(currentlevel)+currentNode+" "+jsNode.fieldType);

    }
  return jsNode;
}




