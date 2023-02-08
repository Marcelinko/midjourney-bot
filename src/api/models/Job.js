const { ObjectId } = require('mongodb');

class Job {
    constructor(prompt) {
        this.jobId = new ObjectId();
        this.prompt = prompt;
        this.status = Status.QUEUED;
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
    PENDING: 'pending',
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