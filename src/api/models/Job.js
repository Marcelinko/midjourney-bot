const { ObjectId } = require('mongodb');

module.exports = class Job {
    constructor(prompt) {
        this.job_id = new ObjectId();
        this.prompt = prompt;
        this.status = "pending";
    }
    setStatus(status) {
        this.status = status;
    }
}