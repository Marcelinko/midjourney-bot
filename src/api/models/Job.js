const { ObjectId } = require('mongodb');

class Job {
    constructor(prompt) {
        this.job_id = new ObjectId();
        this.prompt = prompt;
    }
    getPrompt() {
        return this.prompt;
    }
    getStatus() {
        return this.status;
    }
    setStatus(status) {
        this.status = status;
    }
}

const Status = {
    GENERATING: 'generating',
    UPLOADING: 'uploading',
    READY: 'ready',
    QUEUED: 'queued',
    FAILED: 'failed'
};

module.exports = {
    Job,
    Status
};
