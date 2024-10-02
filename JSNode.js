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
    
    compare(node) {
      var result = false;

      if (this.nodeType === node.nodeType && this.nodeName == node.nodeName && this.description === node.description)
        result = true;

      return result;
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

  compare(node) {
    var result = false;

    if (super.compare(node) && this.compositionType === node.compositionType && this.children.length === node.children.length) {
    if (this.children.length >0) {
      if (this.children[0].compare(node.children[0])) // Приналичии дочерних узлов незатейливо сравниваем 2 первых
        result = true;
    }
    else  
      result = true;

    }
    return result;
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

  compare(node) {
    var result = false;

    if (super.compare(node) && this.fieldType === node.fieldType && this.fieldFormat === node.fieldFormat)
      result = true;

    return result;
  }

} 


exports.NodeType = NodeType;
exports.CompositionType = CompositionType;
exports.FieldType = FieldType;
exports.JSNode = JSNode;
exports.JSCompositeNode = JSCompositeNode;
exports.JSFieldNode = JSFieldNode;
