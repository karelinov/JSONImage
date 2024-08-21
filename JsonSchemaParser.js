/**
 * Модуль с функциями разбора структуры JSON схемы
 */

const JSRP = require('@apidevtools/json-schema-ref-parser');
const jsnode = require('./JSNode.js');
const TResult = require('./tresult.js');


/**
 * Функция возвращает JSON - структуру схемы, содержащую только аспекты, которые будут отображаться на иллюстрации
 * @param {string} inputFile имя разбираемого файла
 * @returns {jsnode.JSNode} структура JSNode
 */
exports.GetJSData = async function GetJSData(inputFile) {
  var result = new TResult();
    
  try {
    var dereferencedJSONSchema = await GetFlatFile(inputFile);

    var currentLevel = 1;
    var currentNode = dereferencedJSONSchema; // текущий узел устанавливаем корнем схемы - там предполагаем наличие элемента "type": "object|array"
    var jsNode =TraverseSchema(currentLevel, currentNode);

      result.resultObject = jsNode;
  }
  catch (error) {
   result.result = false;
   result.resultObject = error;
  }
  return result;
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
 * @returns {jsnode.JSNode} структура JSNode 
 */
function TraverseSchema(currentlevel, currentNode, parentNode = null, parentNodeName =null) {

    /** @type {jsnode.JSNode} */
    var jsNode;

    if (currentNode.type && currentNode.type === "object") { // для object потребуется двигаться глубже
      console.log("-".repeat(currentlevel)+" object "+(currentNode.description?currentNode.description.toString():"(no description)"));
      jsNode = new jsnode.JSCompositeNode();
      jsNode.compositionType = jsnode.CompositionType.OBJECT;
      jsNode.nodeName = parentNodeName;
      jsNode.description = currentNode.description;

      // проходимся по дочерним узлам в properties
      let properties = currentNode.properties;
      if (currentNode.properties) {
        for (let key in currentNode.properties) {
          if (key) {
            let childNode = properties[key];
            let childJSNode = TraverseSchema(currentlevel + 1, childNode, currentNode, key);
            jsNode.children.push(childJSNode);
          }
        }
      }
    }
    else if (currentNode.type && currentNode.type === "array") { // для array потребуется двигаться глубже
      console.log("-".repeat(currentlevel)+" array "+(currentNode.description?currentNode.description.toString():"(no description)"));
      jsNode = new jsnode.JSCompositeNode();
      jsNode.compositionType = jsnode.CompositionType.ARRAY;
      jsNode.nodeName = parentNodeName;
      jsNode.description = currentNode.description;

      let curNode = currentNode.items;
      let key = null
      let childJSNode = TraverseSchema(currentlevel + 1, curNode, currentNode, key);
      jsNode.children.push(childJSNode);

    }
    else {// для прочих/примитивных типов считаем, что достигли "дна" данной ветки - печатаем результат и возврат
      jsNode = new jsnode.JSFieldNode();
      jsNode.nodeName = parentNodeName;
      jsNode.description = currentNode.description;

      if (currentNode.type) {
        if (typeof(currentNode.type) ==="string")
          jsNode.fieldType = jsnode.FieldType.STRING;
        else if (Array.isArray(currentNode.type)) {  // вообще массива быть не должно - устарело
          let symbolValue = Symbol.for(currentNode.type[0].toUpperCase());
          if (Object.keys(jsnode.FieldType).includes(Symbol.keyFor(symbolValue)))
            jsNode.fieldType = symbolValue;
          else
            jsNode.fieldType = jsnode.FieldType.UNKNOWN;
        }
        else 
          jsNode.fieldType = jsnode.FieldType.UNKNOWN;
      }   
      else
        jsNode.fieldType = jsnode.FieldType.UNDEFINED;

      if(currentNode.type ==="string" && currentNode.format)
        jsNode.fieldFormat = currentNode.format;

      console.log("-".repeat(currentlevel)+" "+Symbol.keyFor(jsNode.fieldType).toLowerCase() +" "+(currentNode.description?currentNode.description.toString():"(no description)"));

    }
  return jsNode;
}




