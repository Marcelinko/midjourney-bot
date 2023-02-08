
module.exports = class Channel {
    constructor(channelId, bot) {
        this.channelId = channelId;//doesn't change
        this.bot = bot;//doesn't change
        this.job = null;//can change
        this.isFree = true;//can change
    }

    setJob(job){
        this.job = job;
    }

    setIsFree(isFree){
        this.isFree = isFree;
    }

    getIsFree() {
        return this.isFree;
    }
    getChannelId() {
        return this.channelId;
    }
    getJob() {
        return this.job;
    }
}

