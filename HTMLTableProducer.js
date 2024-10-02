/**
 * Модуль с функциями формирования HTML с таблицей
 * с информацией о JSON Schema
 */

const jsnode = require('./JSNode.js');
const cellnode = require('./CellNode.js');
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
        // Вычисляем rowspan для ячеек
        jsMatrix = SetMatrixRowspan(jsMatrix);
        // Вычисляем ширину для ячеек
        //jsMatrix = SetColWidth(jsMatrix);


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
 * @param {array<cellnode.CellNode,cellnode.CellNode>} resultMatrix рекурсивный параметр с тек. результатом 
 * @param {jsnode.JSNode} indexC рекурсивный параметр с тек. столбцом ячейки, куда разместить узел
 * @param {jsnode.JSNode} IndexR рекурсивный параметр с тек. строкой ячейки, куда разместить узел
 * @returns {array<cellnode.CellNode,cellnode.CellNode>} двумерный массив, в ячейках - CellNode (JSNode+HTMLData)
 */
function GetMatrixForNode(jsNode, resultMatrix, indexC, indexR) {
    try {
        var result = resultMatrix;
        if (!result) {
            result = [Array(1)]; // при первом вызове рекурсивной функции создаём двумерный массив из 1 ячейки
            result[0][0] = new cellnode.CellNode();
        }

        result[indexC][indexR].jsNode =  jsNode; // записываем в текущую ячейку текущий узел

        if (jsNode.nodeType ==  jsnode.NodeType.NODE) { // если тип узла - комплексный - разворачиваем дальше
        
            // проходимся по дочерним узлам, инициируем их запись в результирующую матрицу
            for(let i=0; i<jsNode.children.length; i++) {
                // Сначала расширяем матрицу под дочерние узлы, (если надо) добавляя столбец+ строки под количество дочерних узлов
                // дочерний элемент вставляется в indexC+1, indexR+<номер доч элемента>
                // при отсутствии в матрице такого столбца/строки они вставляются
                if (result.length < indexC+2) {
                    result.length += 1; // добавляем столбец
                    result[result.length-1] = Array(result[0].length); // в столбец - массив с таким же кол-вом элементов, как первом
                    // заполняем ячейки нового столбца пустыми объектами
                    for(let indexR1 = 0; indexR1 < result[result.length-1].length; indexR1++)
                        result[indexC+1][indexR1] = new cellnode.CellNode();

                }
                if (result[0].length < indexR+i+1) {
                    for(let с=0; с<result.length; с++) // добавляем строку увеличивая на +1 длину столбцов
                        result[с].length +=1;

                    // заполняем ячейки новой строки пустыми объектами
                    for(let indexC1 = 0; indexC1 < result.length; indexC1++)
                        result[indexC1][indexR] = new cellnode.CellNode();
                }
                // Инициируем запись дочерних узлов в результирующую матрицу
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
 * @param {*} jsMatrix двумерный (разряженный) массив/матрица, в ячейках которого помещены объекты CellNode
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
            tableString+="<tr>"; // строка
            // конструируем в строке ячейки столбцов
            for(let indexC=0; indexC<jsMatrix.length; indexC++) {
                // @Type cellnode.CellNode
                let curCellNode = jsMatrix[indexC][indexR];

                if (curCellNode.htmlData.shadowed == false) {// если ранее не вычислили, что ячейка не нужна
                    tableString+="<td";

                    let classAttr = "";
                    let cellClass;
                    let cellValue ="";
                    let rowspanAttr = "";
                    let colwidthAttr = "";

                    if(curCellNode.htmlData.rowspan >1)
                        rowspanAttr = " rowspan=\""+curCellNode.htmlData.rowspan+"\"";


                    if(curCellNode.jsNode != null) { // если в ячейке JSNode, записываем его данные в ячейку
                        // @Type jsnode.JSNode
                        let curNode = curCellNode.jsNode;

                        cellClass = GetCellClass(curNode);
                        if (cellClass) classAttr = " class=\""+cellClass+"\"";
                        cellValue = GetCellText(curNode);
                    }

                    if (indexR == 0 && curCellNode.htmlData.colwidth >0) {
                        //colwidthAttr = "width:"+curCellNode.htmlData.colwidth+"px;";
                    }


                    tableString+=classAttr+rowspanAttr;
                    if (colwidthAttr !== "") {
                        tableString+=" style=\""+colwidthAttr;
                        tableString+="\"";
                    }
                    tableString+=">"
                    //tableString+=rowspanAttr;
                    tableString+=cellValue+"</td>"
                }
                else {
                   //tableString+="<td>shadowed</td>"
                }
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
            result +="<span class=\"NODE_FIELD_NAME\">"+(jsNode.nodeName?jsNode.nodeName:"")+"</span><BR>"
            result +=" <span class=\"NODE_FIELD_TYPE\">"+Symbol.keyFor(jsNode.compositionType)+"</span>"
            if (jsNode.description)
                result +="<BR><span class=\"NODE_FIELD_COMMENT\">"+jsNode.description+"</span>"
        }
        else {
            result +="<span class=\"NODE_FIELD_NAME\">"+(jsNode.nodeName?jsNode.nodeName:"")+"</span>"
            result +=" <span class=\"NODE_FIELD_TYPE\">"+Symbol.keyFor(jsNode.fieldType).toLowerCase()+"</span>"
            if (jsNode.description)
                result +="<BR><span class=\"NODE_FIELD_COMMENT\">"+jsNode.description+"</span>"
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
        if (jsNode.nodeType == jsnode.NodeType.FIELD) {
            result = "NODE_FIELD";
        }
    }    
    catch (error) {
        throw error;
    }

    return result;
}

/**
 * Функция устанавливает атрибуты rowspan для ячеек матрицы
 * @param {*} jsMatrix двумерный (разряженный) массив/матрица, в ячейках которого помещены объекты JSNode
 * @returns {array<cellnode.JSNode,cellnode.JSNode>} двумерный массив, в ячейках - JSNode
 */
function SetMatrixRowspan(jsMatrix) {
    
    try {

        // Проходимся по матрице
        for(let indexR=0; indexR<jsMatrix[0].length; indexR++) { 
            for(let indexC=0; indexC<jsMatrix.length; indexC++) {
                // @Type cellnode.CellNode
                let curCellNode = jsMatrix[indexC][indexR];

                if (curCellNode.jsNode !== null) { // у нас в ячейке есть JSNode. 
                    if (curCellNode.jsNode.nodeType == jsnode.NodeType.NODE) {
                        if (curCellNode.jsNode instanceof jsnode.JSCompositeNode && curCellNode.jsNode.compositionType === jsnode.CompositionType.OBJECT) {
                            // Алгоритм для объекта : ползём по ячейкам вниз, пока в ячейках справа дочерние узлы
                            // До этого места будем делать rowspan
                            // При этом ползти надо до конца таблицы, т.к непонятно где закончатся дочерние элементы, а между ними пустые ячейки
                            let lastConfirmedChildrow = indexR;
                            if (curCellNode.jsNode.children.length > 0) {
                                for(let indexR1=indexR+1; indexR1 < jsMatrix[0].length ; indexR1++) { 
                                    // @Type cellnode.CellNode
                                    let nextRightNode = jsMatrix[indexC+1][indexR1];
                                    if (nextRightNode.jsNode !== null) {
                                        if (curCellNode.jsNode.children.some((node) => node.compare(nextRightNode.jsNode))) // дочерний элемент объекта - значит rowspan edtkbxbdftv 
                                        lastConfirmedChildrow = indexR1; 
                                    }
                                }
                            }
                            // добавляем к rowspan-у смещение до последней ячейки с дочерними узлами
                            curCellNode.htmlData.rowspan += (lastConfirmedChildrow - indexR);

                            // когда поняли, сколько rowspan, проходимся по ячейкам под объектом и отмечаем, что не нужны
                            if (curCellNode.htmlData.rowspan >1) {
                                for(let indexR1=indexR+1; indexR1 < indexR+1 + curCellNode.htmlData.rowspan -1; indexR1++) { 
                                    let nextCellNode = jsMatrix[indexC][indexR1];  
                                    if ((nextCellNode.jsNode == null)) { // на всякий случай
                                        nextCellNode.htmlData.shadowed = true; // пишем, что ячейка не нужна (не будет генериться в HTML)
                                    }
        
                                }
                            }
                        }
                        /*
                        // Пройдёмся по столбцу "вниз", отметим в пустых ячейках, что не нужны. 
                        // А количество таких запишем в rowspan тек узла
                        //for(let indexR1=indexR+1; indexR1 < indexR+1+curCellNode.jsNode.children.length; indexR1++) { // объединяем не больше ячеек чем дочерних узлов
                        for(let indexR1=indexR+1; indexR1 < indexR+1+curCellNode.jsNode.children.length-1; indexR1++) { // объединяем не больше ячеек чем дочерних узлов
                            // @Type cellnode.CellNode
                            let nextCellNode = jsMatrix[indexC][indexR1];

                            if ((nextCellNode.jsNode == null)) {
                                nextCellNode.htmlData.shadowed = true;
                                curCellNode.htmlData.rowspan++;
                            }
                            else
                            break; // если там ниже JSNode, то rowspan-ы не нужны
                        }
                        */
                    }
                }
            }
        }
    }
    catch(error) {
        throw error;
    }    
    return jsMatrix;
}

/**
 * Функция устанавливает атрибуты width для столбцов матрицы
 * @param {*} jsMatrix двумерный (разряженный) массив/матрица, в ячейках которого помещены объекты JSNode
 * @returns {array<cellnode.JSNode,cellnode.JSNode>} двумерный массив, в ячейках - JSNode
 */
function SetColWidth(jsMatrix) {
    
    try {

        // Проходимся по матрице
        for(let indexC=0; indexC<jsMatrix.length; indexC++) {
            let colwidth = jsMatrix[indexC][0].htmlData.colwidth;

            for(let indexR=0; indexR<jsMatrix[0].length; indexR++) { 
                if(jsMatrix[indexC][indexR].jsNode !== null) {
                    if(jsMatrix[indexC][indexR].jsNode.nodeType == jsnode.NodeType.FIELD) // если поле - отмечаем, что надо пошире
                        colwidth = 200;
                }
            }
            jsMatrix[indexC][0].htmlData.colwidth = colwidth;

        }
    }
    catch(error) {
        throw error;
    }    
    return jsMatrix;
}
