
module.exports = class Channel {
    constructor(bot, channelId) {
        this.channelId = channelId;
        this.botToken = bot;
        this.job = null;
        this.isFree = true;
    }

    giveJob(job){
        this.isFree = false;
        this.job = job;
    }

    free(){
        this.isFree = true;
    }

}

