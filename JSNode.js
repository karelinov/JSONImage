exports.JSNode = class {
    schemaComposition = "FIELD";
    nodeName;
    fieldType;
    fieldFormat;
    children = [];

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