const jsnode = require('./JSNode.js');

/**
 * Модуль с классами CellNode, описывающими структуру ячеек HTML таблицы
 * (для последующей генерации по этому описанию HTML - таблицы)
 */

/**
 * Структура CellNode с данными JSNode (JS схемы) и данными для отрисовки HTML
 * @property {JSNode} jsNode
 * @property {string} nodeName
 */
class CellNode {
    jsNode = null;
    htmlData = new HTMLData();

    constructor (optionsPOJO) {
        if (optionsPOJO) {
            for (let key in optionsPOJO) {
              // eslint-disable-next-line no-prototype-builtins
              if(this.hasOwnProperty(key)) 
                this[key] = optionsPOJO[key];
              else throw new Error("Неизвестное поле "+key);  
            }
        }
    }      
}

/**
 * Структура для инкапсуляции рассчитанных свойств HTML - ячеек (rowspan)
 * @property {integer} rowspan значение атрибута rowspan для ячейки
 * @property {boolean} shadowed признак, что ячейка вытесняется атрибутом rowspan другой ячейки. Создание этой ячейки в HTML не нужно
 * @property {integer} colwidth Атрибут width для HTML столбца;
 */
class HTMLData {
    rowspan = 1;
    shadowed = false;
    colwidth = 0;

    constructor (optionsPOJO) {
        if (optionsPOJO) {
            for (let key in optionsPOJO) {
              // eslint-disable-next-line no-prototype-builtins
              if(this.hasOwnProperty(key)) 
                this[key] = optionsPOJO[key];
              else throw new Error("Неизвестное поле "+key);  
            }
        }
    }      
}

exports.CellNode = CellNode;
exports.HTMLData = HTMLData;
