const { Client } = require("discord.js-selfbot-v13");
const Channel = require("../models/Channel");
const { Job, Status } = require("../models/Job");
const Bot = require("../models/Bot");
const BotConfig = require("../../config/bots");
const Jimp = require("jimp");
const s3 = require("./s3");
const api = require('./api');

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
        channel.free();
        return;
    }
    if (job.getStatus() === Status.PENDING) {
        job.setStatus(Status.IN_PROGRESS);
    }
    else if (job.getStatus() === Status.IN_PROGRESS) {
        job.setStatus(Status.COMPLETED);
        channel.free();
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
            updateJobStatus(channel, message);
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




// const uploadPreviewImage = async (job) => {
//     try {
//         const res = await axios.get(job.image_url, {
//             responseType: 'arraybuffer',
//         });

//         const originalImage = await Jimp.read(res.data);
//         const overlayImage = await Jimp.read('./Preview.png');
//         originalImage.composite(overlayImage, 0, 0, {
//             mode: Jimp.BLEND_SOURCE_OVER,
//             opacitySource: 0.5,
//         });
//         const buffer = await originalImage.getBufferAsync(Jimp.MIME_JPEG);
//         await s3.uploadImage(job.image_preview, buffer);
//     }
//     catch (err) {
//         console.log(err);
//         return;
//     }
// }

module.exports = {
    createJob,
    processJob,
    initializeListenerClient,
    initializeChannelBots,
}
