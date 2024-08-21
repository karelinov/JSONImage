/**
 * Модуль с функциями формирования HTML с таблицей
 * с информацией о JSON Schema
 */

const jsnode = require('./JSNode.js');
const jsp = require('./JsonSchemaParser.js');
const fs = require('node:fs/promises');
const TResult = require('./tresult.js');


/**
 * Построение по данным JSNode, HTML-файла с таблицей, описывающей JSNode
 * 
 * @param {jsnode.JSNode} jsNode 
 * @returns {TResult<string>} результирующий HTML - файл
 */
exports.GetHTMLForNode = async function GetHTMLForNode(jsNode) {
    var result = new TResult();
    
    try {
        // Конструируем из JSNode двумерную матрицу
        var jsMatrix = GetMatrixForNode(jsNode, null, 0, 0);

        // Конструируем HTML - файл с таблицей на основе матрицы
        var htmlResult =  await GetHTMLForMatrix(jsMatrix);
        if  (!htmlResult.result)
            throw new Error("Ошибка GetHTMLForMatrix: "+htmlResult.resultObject);

        result.resultObject = htmlResult.resultObject;
    }
    catch (error) {
     result.result = false;
     result.resultObject = error;
    }
    return result;
}


/**
 * (Рекурсивно) Конструирует Матрицу (двумерный массив) по следующим правилам: 
 * На входе - JSNode.
 * Помещаем JSNode в правый нижний угол матрицы
 * Если JSNode - комплексный, расширение матрицы и помещение в неё дочерних узлов "справа" от рассматриваемого 
 *   * 
 * @param {jsnode.JSNode} jsNode текущий узел, который надо поместить в матрицу
 * @param {array<JSNode,JSNode>} resultMatrix рекурсивный параметр с тек. результатом 
 * @param {jsnode.JSNode} indexC рекурсивный параметр с тек. столбцом ячейки, куда разместить узел
 * @param {jsnode.JSNode} IndexR рекурсивный параметр с тек. строкой ячейки, куда разместить узел
 * @returns {array<JSNode,JSNode>} двумерный массив, в ячейках - JSNode
 */
function GetMatrixForNode(jsNode, resultMatrix, indexC, indexR) {
    try {
        var result = resultMatrix;
        if (!resultMatrix) result = [Array(1)]; // при первом вызове рекурсивной функции создаём двумерный массив из 1 ячейки

        result[indexC][indexR] = jsNode; // записываем в текущую ячейку текущий узел

        if (jsNode.nodeType ==  jsnode.NodeType.NODE) { // если тип узла - комплексный - разворачиваем дальше
            // проходимся по дочерним узлам, записываем их в результирующую матрицу
            for(let i=0; i<jsNode.children.length; i++) {
                // дочерний элемент вставляется в indexC+1, indexR+<номер доч элемента>
                // при отсутствии в матрице такого столбца/строки они вставляются
                if (result.length < indexC+2) {
                    result.length += 1; // добавляем столбец
                    result[result.length-1] = Array(result[0].length); // в столбец - массив с таким же кол-вом элементов, как первом
                }
                if (result[0].length < indexR+i+1) {
                    for(let i=0; i<result.length; i++) // добавляем строку увеличивая на +1 длину столбцов
                        result[i].length +=1;
        
                }
                result = GetMatrixForNode(jsNode.children[i], result, indexC+1, indexR);
                indexR = result[0].length; // при рекурсивных вызовах функции мы могли сместиться на много строк вниз, поэтому "встаём" на последнюю строчку матрицы
                
                
            }
        }
        else {
        // если тип узла = FIELD  - значит глубже разворачиваться не надо, завершаем работу функции
        }
    }    
    catch(error) {
        throw error;
    }    

    return result;
}




/**
 * Конструирует РЕЗУЛЬТИРУЮЩИЙ HTML, являющийся иллюстративным материалом для документации
 * 
 * @param {*} jsMatrix двумерный (разряженный) массив/матрица, в ячейках которого помещены объекты JSNode
 * @returns {TResult<HTML>} РЕЗУЛЬТИРУЮЩИЙ HTML
 */
async function GetHTMLForMatrix(jsMatrix) {
    var result = new TResult();
    
    try {
        // загружаем шаблон HTML
        result.resultObject = (await fs.readFile("./DATA/IN/res.html")).toString();
        console.log("Загружен HTML - шаблон "+result.resultObject);
        
        // конструируем таблицу
        var tableString = "";

        for(let indexR=0; indexR<jsMatrix[0].length; indexR++) { // конструируем HTML таблицу с размерностью матрицы
            tableString+="<tr";
            tableString+=">";
            for(let indexC=0; indexC<jsMatrix.length; indexC++) {
                let classAttr = "";
                let cellClass;
                let cellValue ="";
                if(jsMatrix[indexC][indexR]) { // если ячейка метрицы не пустая -> там JSNode, записываем его данные в ячейку
                    // @Type jsnode.JSNode
                    let curNode = jsMatrix[indexC][indexR];

                    cellClass = GetCellClass(curNode);
                    if (cellClass) classAttr = " class=\""+cellClass+"\"";
                    cellValue = GetCellText(curNode);
                }
                tableString+="<td";
                tableString+=classAttr;
                tableString+=">"
                tableString+=cellValue+"</td>"
            }
            tableString+="</tr>"
        }


        result.resultObject=result.resultObject.replace("####",tableString);
    }
    catch (error) {
     result.result = false;
     result.resultObject = error;
    }
    return result;
}

/**
 * Конструирование из JSNode текста для ячейки таблицы
 * @param {jsnode.JSNode} jsNode 
 */
function GetCellText(jsNode) {
    var result = "";

    try {
        if (jsNode.nodeType == jsnode.NodeType.NODE) {
            result = (jsNode.nodeName?jsNode.nodeName:"") +" "+Symbol.keyFor(jsNode.compositionType);
            if (jsNode.description)
                result +="<BR>"+jsNode.description
        }
        else {
            result = (jsNode.nodeName?jsNode.nodeName:"") +" "+Symbol.keyFor(jsNode.fieldType).toLowerCase()
            if (jsNode.description)
                result +="<BR>"+jsNode.description
        }
    }    
    catch (error) {
        throw error;
    }

    return result;
}

/**
 * Получение стиля ячейки с узлом
 * @param {jsnode.JSNode} jsNode 
 */
function GetCellClass(jsNode) {
    var result = null;

    try {
        if (jsNode.nodeType == jsnode.NodeType.NODE) {
            switch (jsNode.compositionType) {
                case (jsnode.CompositionType.OBJECT): result = "NODE_OBJECT"; break;
                case (jsnode.CompositionType.ARRAY): result = "NODE_ARRAY"; break;
                case (jsnode.CompositionType.ALLOF): result = "NODE_Composition"; break;
                case (jsnode.CompositionType.ANYOF): result = "NODE_Composition"; break;
                case (jsnode.CompositionType.ONEOF): result = "NODE_Composition"; break;
            }
        }
    }    
    catch (error) {
        throw error;
    }

    return result;
}