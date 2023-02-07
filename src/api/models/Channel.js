
module.exports = class Channel {
    constructor(channelId, bot) {
        this.channelId = channelId;//doesn't change
        this.bot = bot;//doesn't change
        this.job = null;//can change
        this.isFree = true;//can change
    }
    giveJob(job) {
        this.isFree = false;
        this.job = job;
    }
    free() {
        this.job = null;
        this.isFree = true;
    }
    getStatus() {
        return this.isFree;
    }
    getChannelId() {
        return this.channelId;
    }
    getJob() {
        return this.job;
    }
}

