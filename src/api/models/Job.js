const { ObjectId } = require('mongodb');

class Job {
    constructor(prompt) {
        this.job_id = new ObjectId();
        this.prompt = prompt;
        this.status = Status.PENDING;
    }
    setStatus(status) {
        this.status = status;
    }
}

const Status = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

module.exports = {
    Job,
    Status
};
