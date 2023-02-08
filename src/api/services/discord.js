const { Client } = require("discord.js-selfbot-v13");
const Channel = require("../models/Channel");
const { Job, Status } = require("../models/Job");
const Bot = require("../models/Bot");
const BotConfig = require("../../config/bots");
const jimp = require("./jimp.js");
const s3 = require("./s3");
const api = require("./api");
const { uploadImage } = require("./s3");
const axios = require("./axios.js");
const db = require("./db");
const Semaphore = require('semaphore');
const semaphore = new Semaphore(1);

let channels = [];
let jobs = [];

setInterval(function () {
    let jobArray = "jobArray: "
    let channelArray = "channelAray: "
    // jobs.forEach(job => {
    //     jobArray = jobArray + job.getStatus() + " ";
    // });

    channels.forEach(channel => {
        channelArray = channelArray + channel.getIsFree() + " ";
    });

    //console.log(jobArray)
    console.log(channelArray)
    console.log("Queue length: " + getQueueLength());
}, 1000);

const jobSemaphore = async () => {
    semaphore.take(() => {
        const firstQueuedJob = getFirstQueuedJob();
        const freeChannel = getFreeChannel();
        if (!firstQueuedJob) {
            console.log("No more queued jobs");
            semaphore.leave();
            return;
        }
        if (!freeChannel) {
            console.log("No more free channels, job will begin when a channel is free");
            semaphore.leave();
            return;
        }
        giveJobToChannel(firstQueuedJob, freeChannel);
        semaphore.leave();
    });
}

const getQueueLength = () => {
    return jobs.filter(job => { return job.getStatus() === Status.QUEUED }).length;
}

//Returns first queued job
const getFirstQueuedJob = () => {
    return jobs.find(job => { return job.getStatus() === Status.QUEUED });
};

const getChannelByChannelId = (channelId) => {
    return channels.find((channel) => channel.getChannelId() === channelId);
}

//Returns channel from bot with most free channels
const getFreeChannel = () => {
    return channels.find((channel) => channel.getIsFree());
};

const createJob = (prompt) => {
    const job = new Job(prompt);
    jobs.push(job);
    return job;
}

//Returns prompt from message
const getPromptFromMessage = (message) => {
    return message.match(/\*\*(.*?)\*\*/)[1];
};

const updateJobStatus = (job, status) => {
    job.setStatus(status);
};

const freeChannel = (channel) => {
    channel.setJob(null);
    channel.setIsFree(true);
};

const giveJobToChannel = (job, channel) => {
    channel.setJob(job);
    channel.setIsFree(false);
    api.sendInteraction(job, channel);
};


const handleMessage = async (message) => {
    if (message.author.bot) {
        //find channel that has the same channel id as message channel id
        const channel = getChannelByChannelId(message.channelId);
        if (channel) {
            const job = channel.getJob();
            if (job.getStatus() === Status.QUEUED) {
                updateJobStatus(job, Status.GENERATING);
            }
            else if (job.getStatus() === Status.GENERATING) {
                updateJobStatus(job, Status.UPLOADING);
                freeChannel(channel);
                //upload image to s3
                await jobSemaphore();
            }
        }
    }
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
    axios.downloadImage(imageUrl).then(res => {
        s3.uploadImage(message.attachments.first().name, res.data).then(() => {
            //const generatedImage = new GeneratedImage();
            //db.createGeneratedImage(generatedImage).then(job.status = Status.READY);
            job.status = Status.READY;
        })
    })
}

module.exports = {
    jobSemaphore,
    createJob,
    initializeListenerClient,
    initializeChannelBots,
}
