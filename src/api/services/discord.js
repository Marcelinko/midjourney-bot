const { Client, MessageAttachment} = require("discord.js-selfbot-v13");
const Channel = require("../models/Channel");
const { Job, Status } = require("../models/Job");
const Bot = require("../models/Bot");
const BotConfig = require("../../config/bots");
const jimp = require("./jimp.js");
const s3 = require("./s3");
const api = require("./api");
const {uploadImage} = require("./s3");
const axios = require("./axios.js");
const {response} = require("express");
const db = require("./db");
const Semaphore = require('semaphore');
const Bottleneck = require("bottleneck")

let channels = [];

let jobs = [];

setInterval(function(){
    let jobArray = "jobArray: "
    let channelArray = "channelAray: "
    jobs.forEach(job => {
        jobArray = jobArray + job.getStatus() + " ";
    });

    channels.forEach(channel => {
        channelArray = channelArray + channel.getIsFree() + " ";
    });

    console.log(jobArray)
    console.log(channelArray)
    console.log()
}, 1000);


const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1400
});

const jobBottleneck = limiter.wrap(() => {

        // let firstQueuedJob = jobs.find(job => { return job.getStatus() === Status.QUEUED});
        //
        // if(firstQueuedJob){
        //     //check if there are any free channels
        //     const channel = getFreeChannel();
        //     if(channel) {
        //         giveJobToChannel(channel, firstQueuedJob);
        //     } else {
        //         return;
        //     }
        // }

});

setInterval(function(){
    let firstQueuedJob = jobs.find(job => { return job.getStatus() === Status.QUEUED});

    if(firstQueuedJob){
        //check if there are any free channels
        const channel = getFreeChannel();
        if(channel) {
            giveJobToChannel(channel, firstQueuedJob);
        } else {
            return;
        }
    }
}, 1400);



const blockBot = (bot, time) => {
    bot.isBlocked = true;
    console.log("Block: " + bot.getSessionId());
    setTimeout(() => {
        bot.isBlocked = false
        //jobSemaphore();
    }, time)

}

// const jobSemaphore = async () => {
//     semaphore.take();
//     try {
//         //check if any job has status QUEUED
//         jobs.forEach(job => {
//             if(job.getStats() === Status.QUEUED){
//                 //check if there are any free channels
//                 const channel = getFreeChannel();
//                 if(channel) {
//                     giveJobToChannel(channel, job);
//                 } else {
//                     return;
//                 }
//             }
//         })
//     } finally {
//         semaphore.leave();
//     }
// };


//Creates and returns new job
const createJob = (prompt) => {
    return new Job(prompt);
};



const giveJobToChannel = (channel, job) => {
    channel.setIsFree(false);
    channel.setJob(job);
    // limiter.submit(() => {
    //     // Do your request here
    //     api.sendInteraction(job, channel);
    // });
    //blockBot(channel.bot, 1800);
    api.sendInteraction(job, channel);
}

const freeChannel = (channel) => {
    channel.setJob(null);
    channel.setIsFree(true);
}


//Queues job
const queueJob = (job) => {
    job.setStatus(Status.QUEUED);
    jobs.push(job);
};

/*//Start job
const startJob = (job) => {
    jobs.push(job);
    job.setStatus(Status.GENERATING);
};*/

//Returns free channel
// const getFreeChannel = () => {
//     return channels.find((channel) => channel.getIsFree());
// };

const getFreeChannel = () => {
    let botWithMostFreeChannels = null;
    let mostFreeChannels = 0;
    const uniqueBots = new Set();

    for (const channel of channels) {
        uniqueBots.add(channel.bot);
        if (channel.isFree) {
            const freeChannels = channels.filter(ch => ch.bot === channel.bot && ch.isFree).length;
            if (freeChannels > mostFreeChannels) {
                botWithMostFreeChannels = channel.bot;
                mostFreeChannels = freeChannels;
            }
        }
    }

    if (botWithMostFreeChannels) {
        return channels.find(channel => channel.bot === botWithMostFreeChannels && channel.isFree);
    }
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
    }
    if (job.getStatus() === Status.QUEUED) {
        job.setStatus(Status.GENERATING);
    }
    else if (job.getStatus() === Status.GENERATING) {
        job.setStatus(Status.UPLOADING);
    }
    return job.status;
}

//Starts job or queues it if there are no free channels
const addJobToJobs = async (job) => {
    queueJob(job);
    jobBottleneck();
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
                freeChannel(channel);
            } else if(jobStatus === Status.UPLOADING) {
                saveGeneratedImage(message, channel.job);
                freeChannel(channel);
                jobBottleneck();

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
    axios.downloadImage(imageUrl).then(res => {
        s3.uploadImage(message.attachments.first().name, res.data).then(() => {
            //const generatedImage = new GeneratedImage();
            //db.createGeneratedImage(generatedImage).then(job.status = Status.READY);
            job.status = Status.READY;
        })
    })

}



module.exports = {
    queueJob,
    createJob,
    addJobToJobs,
    initializeListenerClient,
    initializeChannelBots,
}
