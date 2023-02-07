const { ObjectId } = require('mongodb');

class Job {
    constructor(prompt) {
        this.job_id = new ObjectId();
        this.prompt = prompt;
        this.status = Status.PENDING;
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
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    QUEUED: 'queued',
    FAILED: 'failed'
};

module.exports = {
    Job,
    Status
};
