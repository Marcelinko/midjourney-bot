export default class ErrorObject extends Error {
    constructor(err){
        super();
        this.message = err.message;
        this.statusCode = err.statusCode || 500;
    }
}