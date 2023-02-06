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



const createJob = (prompt) => {
    return new Job(prompt);
};

const processJob = async (job) => {
    const freeChannel = channels.find(channel => channel.isFree);
    if (freeChannel) {
        freeChannel.giveJob(job);
        api.sendInteraction(job, freeChannel);
    } else {
        jobQueue.push(job);
        console.log(jobQueue.length);
    }
}

const getFreeChannel = () => {
    return channels.find((channel) => channel.getStatus());
};

const handleMessage = async (message) => {
    const channel = getFreeChannel();
    if (!channel) {
        //No free channels available, add job to queue

    }

    //const job = new Job(message.content);
    //channel.giveJob(job);
    //jobQueue.push(job);

}

const createListenerClient = async () => {
    const listenerClient = new Client({ checkUpdate: false });
    await listenerClient.login(process.env.LISTENER_CLIENT_TOKEN);
    console.log(`Logged in as ${listenerClient.user.tag}`);

    listenerClient.on('messageCreate', handleMessage);
};



const initializeChannelBots = async () => {

    for (const botConfig of BotConfig) {

        //make new client for each selfbot and login to get session id
        const client = new Client({checkUpdate: false});
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
    initializeChannelBots,
    createListenerClient
}
