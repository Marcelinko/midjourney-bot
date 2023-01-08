const _ = require("lodash");

export class Bot {
  constructor(token) {
    this.token = token;
    this.jobs = [];
    this.maxJobs = 3;
  }
  getToken() {
    return this.token;
  }
  setId(id) {
    this.id = id;
  }
  getId() {
    return this.id;
  }
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }
  getSessionId() {
    return this.sessionId;
  }
  getJobWithId(id) {
    return _.find(this.jobs, { id: id });
  }
  getAllJobs() {
    return this.jobs;
  }
  addNewJob(job) {
    this.jobs.push(job);
  }
  getJobsLength() {
    return length(this.jobs);
  }
}
