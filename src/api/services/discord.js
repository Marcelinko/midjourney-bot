const { Client, MessageAttachment} = require("discord.js-selfbot-v13");
const Channel = require("../models/Channel");
const { Job, Status } = require("../models/Job");
const Bot = require("../models/Bot");
const BotConfig = require("../../config/bots");
const jimp = require("./jimp.js");
const s3 = require("./s3");
const api = require('./api');
const {uploadImage} = require("./s3");
const axios = require("./axios.js");
const {response} = require("express");

const channels = [];
const jobQueue = [];


//Creates and returns new job
const createJob = (prompt) => {
    return new Job(prompt);
};

//Queues job
const queueJob = (job) => {
    job.setStatus(Status.QUEUED);
    jobQueue.push(job);
};

//Returns free channel
const getFreeChannel = () => {
    return channels.find((channel) => channel.getStatus());
};

//Returns prompt from message
const getPromptFromMessage = (message) => {
    return message.match(/\*\*(.*?)\*\*/)[1];
};

//Updates job status
const updateJobStatus = (channel, message) => {
    const job = channel.getJob();
    const prompt = getPromptFromMessage(message.content);
    if (prompt !== job.getPrompt()) {
        job.setStatus(Status.FAILED);
        return job.status;
    }
    if (job.getStatus() === Status.PENDING) {
        job.setStatus(Status.IN_PROGRESS);
        return job.status;
    }
    else if (job.getStatus() === Status.IN_PROGRESS) {
        job.setStatus(Status.COMPLETED);
        return job.status;
    }
}

//Starts job or queues it if there are no free channels
const processJob = async (job) => {
    const freeChannel = getFreeChannel();
    if (freeChannel) {
        freeChannel.giveJob(job);
        api.sendInteraction(job, freeChannel);
    } else {
        queueJob(job);
    }
}

//Returns channel
const getChannelByChannelId = (channelId) => {
    return channels.find((channel) => channel.getChannelId() === channelId);
}

const handleMessage = async (message) => {
    //if (message.author.bot) {
        //Find a channel that has the same channel id as message channel id
        const channel = getChannelByChannelId(message.channelId);
        if (channel) {
            const jobStatus = updateJobStatus(channel, message);
            //if job is finished upload images to aws and free, if failed just free
            if(jobStatus === Status.FAILED){
                channel.free();
            } else if(jobStatus === Status.COMPLETED) {
                await saveGeneratedImage(message, channel.job);
                channel.free();
            }
        }
    //}
}

const initializeListenerClient = async () => {
    const listenerClient = new Client({ checkUpdate: false });
    await listenerClient.login(process.env.LISTENER_CLIENT_TOKEN);
    console.log(`Logged in as ${listenerClient.user.tag}`);
    listenerClient.on('messageCreate', handleMessage);
};



const initializeChannelBots = async () => {

    for (const botConfig of BotConfig) {

        //make new client for each selfbot and login to get session id
        const client = new Client({ checkUpdate: false });
        await client.login(botConfig.accessToken);
        console.log(`Logged in as ${client.user.tag}`);

        //create bot for client
        const bot = new Bot(botConfig.accessToken, client.sessionId);

        //iterate trough channel ids and, assign bots and save in channel array
        botConfig.channelIds.forEach(channelId => {
            //create new bot for channel
            channels.push(new Channel(channelId, bot));
        });
    }
}



const saveGeneratedImage = (message, job) => {

    //read photo from message
    const imageUrl = message.attachments.first().url;
    jimp.readImages(imageUrl);
    console.log(response);
}



module.exports = {
    createJob,
    processJob,
    initializeListenerClient,
    initializeChannelBots,
}
