module.exports = class TResult {
    result = true;
    resultCode = 0;
    resultObject = null;

    constructor (result = true, resultObject = null, resultCode = 0) {
        this.result = result;
        this.resultCode = resultCode;
        this.resultObject = resultObject;
    };

    
}