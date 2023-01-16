module.exports = class Bot {
    constructor(token, channel) {
        this.token = token;
        this.channel = channel;
        this.jobs = [];
    }
    getToken() {
        return this.token;
    }
    getChannel() {
        return this.channel;
    }
    addJob(job) {
        this.jobs.push(job);
    }
    removeJob(index) {
        this.jobs.splice(index, 1);
    }
    getJobs() {
        return this.jobs;
    }
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    getSessionId() {
        return this.sessionId;
    }
}