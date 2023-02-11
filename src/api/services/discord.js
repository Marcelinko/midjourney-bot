const { Client } = require("discord.js-selfbot-v13");
const Channel = require("../models/Channel");
const { Job, Status } = require("../models/Job");
const Bot = require("../models/Bot");
const BotConfig = require("../../config/bots");
const s3 = require("./s3");
const api = require("./api");
const { uploadImage } = require("./s3");
const axios = require("./axios.js");
const db = require("./db");
const io = require("./socket");

let channels = [];
let jobs = [];

setInterval(function () {
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


io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('subscribeToJobUpdates', (jobId) => {
        console.log(`User ${socket.id} subscribed to job updates: ${jobId}`);
        socket.join(`job-${jobId}`);
    });
});

setInterval(() => {
    let firstQueuedJob = getFirstQueuedJob();

    if (firstQueuedJob) {
        //check if there are any free channels
        const channel = getFreeChannel();
        if (channel) {
            giveJobToChannel(channel, firstQueuedJob);
        } else {
            return;
        }
    }
}, 1400);



// const blockBot = (bot, time) => {
//     bot.isBlocked = true;
//     console.log("Block: " + bot.getSessionId());
//     setTimeout(() => {
//         bot.isBlocked = false
//         //jobSemaphore();
//     }, time)

// }

const findJobById = (jobId) => {
    return jobs.find(job => job.getJobId().equals(jobId));
}

const getFirstQueuedJob = () => {
    return jobs.find(job => { return job.getStatus() === Status.QUEUED });
}

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

//TODO: const allQueuedJobs = getAllQueuedJobs(); and then
// allQueuedJobs.forEach((job, index) => {
//     socket.emit('queue_position', { job, queuePosition: index + 1 });
// });
//this goes inside interval, need socket.on first
const getAllQueuedJobs = () => {
    return jobs.filter(job => job.getStatus() === Status.QUEUED);
}

//Creates new job
const createJob = (prompt) => {
    const job = new Job(prompt);
    job.setStatus(Status.QUEUED);
    jobs.push(job);
    return job;
};

//TODO: simplify function
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
//TODO: rewrite function, this only needs to update job status
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
    console.log(`Job ${job.getJobId()} status: ${job.getStatus()}`);
    io.emit(`job-${job.getJobId()}`, { status: job.getStatus() });
    return job.status;
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
        if (jobStatus === Status.FAILED) {
            freeChannel(channel);
        } else if (jobStatus === Status.UPLOADING) {
            saveGeneratedImage(message, channel.job);
            freeChannel(channel);
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
            //TODO: this goes to updateJobStatus
        })
    })

}



module.exports = {
    createJob,
    findJobById,
    initializeListenerClient,
    initializeChannelBots,
}
