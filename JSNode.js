/**
 * Модуль с классами JSNode, описывающими структуру JS Schema
 */


const NodeType = Object.freeze({
  NODE: Symbol('NODE'),
  FIELD: Symbol('FIELD')
});

const CompositionType = Object.freeze({
  OBJECT: Symbol.for('OBJECT'),
  ARRAY: Symbol.for('ARRAY'),
  ONEOF: Symbol.for('ONEOF'),
  ALLOF: Symbol.for('ALLOF'),
  ANYOF: Symbol.for('ANYOF'),
});

const FieldType = Object.freeze({
  STRING: Symbol.for('STRING'),
  NUMBER: Symbol.for('NUMBER'),
  BOOLEAN: Symbol.for('BOOLEAN'),
  NULL: Symbol.for('NULL'),
  OBJECT: Symbol.for('OBJECT'),
  ARRAY: Symbol.for('ARRAY'),
  UNKNOWN: Symbol.for('UNKNOWN'),
  UNDEFINED: Symbol.for('UNDEFINED'),
});


/**
 * @property {NodeType} nodeType
 * @property {string} nodeName
 */
class JSNode {
    nodeType;
    nodeName;
    description;

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
 * @property {CompositionType} compositionType
 * @property {array<JSNode} children
 */
class JSCompositeNode extends JSNode {
  compositionType;
  children = [];
  
  constructor (optionsPOJO) {
    super(optionsPOJO);
    this.nodeType = NodeType.NODE;
  }

} 

/**
 * @property {FieldType} fieldType
 * @property {string} fieldFormat
 */
class JSFieldNode extends JSNode {
  fieldType;
  fieldFormat;

  constructor (optionsPOJO) {
    super(optionsPOJO);
    this.nodeType = NodeType.FIELD;
  }
} 


exports.NodeType = NodeType;
exports.CompositionType = CompositionType;
exports.FieldType = FieldType;
exports.JSNode = JSNode;
exports.JSCompositeNode = JSCompositeNode;
exports.JSFieldNode = JSFieldNode;
