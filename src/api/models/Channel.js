const {Status} = require("./Job");
const api = require("../services/api")
const axios = require("../services/axios");
const s3 = require("../services/s3");
const io = require("../services/socket");
module.exports = class Channel {
    constructor(channelId) {
        this.channelId = channelId;
        this.bot = null;
        this.job = null;
        this.isFree = true;
        //this.isBlocked = false; TODO
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

    addJob(job) {
        this.isFree = false;
        this.job = job;
        api.sendInteraction(job, this.bot, this); //TODO:retry if 429
    }

    setBot(bot){
        this.bot = bot;
    }

    removeJob(){
        this.job = null;
        this.isFree = true;
        this.bot.removeJob();
    }

    handleMessage(message){ //TODO: rename function
        //TODO: job error handling
        if(this.job.getStatus() === Status.QUEUED){
            //update status
            this.job.setStatus(Status.GENERATING);
            io.emit(`job-${this.job.getJobId()}`, { status: this.job.getStatus() });

        }else if(this.job.getStatus() === Status.GENERATING){
            //update status
            this.job.setStatus(Status.UPLOADING);
            io.emit(`job-${this.job.getJobId()}`, { status: this.job.getStatus() });

            //download iamge, upload to s3 and save message info in db
            const imageUrl = message.attachments.first().url;
            axios.downloadImage(imageUrl).then(res => {
                s3.uploadImage(message.attachments.first().name, res.data).then(() => {
                    //const generatedImage = new GeneratedImage(); //TODO
                    //db.createGeneratedImage(generatedImage).then(job.status = Status.READY); //TODO

                    //update status
                    this.job.status = Status.READY;
                    io.emit(`job-${this.job.getJobId()}`, { status: this.job.getStatus() });

                    //remove job from channel
                    this.removeJob();
                })
            })
        }
    }
}

