const { Client } = require("discord.js-selfbot-v13");
const Channel = require("../models/Channel");
const { Job, Status } = require("../models/Job");
const Bot = require("../models/Bot");
const BotConfig = require("../../config/bots");
const axios = require("axios");
const Jimp = require("jimp");
const s3 = require("./s3");


const channels = [];
const midjourneyClients = [];
const jobQueue = [];

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
            channels.push(new Channel(channelId, bot))
        })
    }
}


/*
createClients();

const loginClients = () => {
    for (let i = 0; i < clients.length; i++) {
        clients[i].once('ready', () => {
            console.log(`Logged in as ${clients[i].user.tag}`);
            bots[i].sessionId = clients[i].sessionId;
        });
        clients[i].login(bots[i].accessToken);
    }
}

loginClients();
let xd = new Channel('asdčahosdACCESSTOKEN', 'šasjdaosdjCHANNELID');

xd.giveJob(new Job('buraz'));
console.log(xd);


const processJob = async (job) => {
    const freeChannel = channels.find(channel => channel.isFree);
    if (freeChannel) {
        freeChannel.giveJob(job);
    } else {
        jobQueue.push(job);
    }
    //check if there are any bots available
    for (let i = 0; i < bots.length; i++) {
        if (isBotAvailable(bots[i], job)) {
            job.status = "pending";
            job.start_time = new Date();
            bots[i].addJob(job);
            await limiter.schedule(() => startGeneration(job, bots[i]));
            return job;
        }
    }
    //if no bots are available, add job to jobQueue
    job.status = "queued";
    jobQueue.push(job);
    return job;
}

createJob = (prompt) => {
    return new Job(prompt);
}

bots.forEach(bot => {
    bot.chanelIds.forEach(channelId => {
        channels.push(new Channel(bot.accessToken, channelId));
    });
});

clients[0].on('messageCreate', async message => {
    //if message author is midjourn  ey bot
    if (message.author.bot) {
    }
});*/

const uploadPreviewImage = async (job) => {
    try {
        const res = await axios.get(job.image_url, {
            responseType: 'arraybuffer',
        });

        const originalImage = await Jimp.read(res.data);
        const overlayImage = await Jimp.read('./Preview.png');
        originalImage.composite(overlayImage, 0, 0, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 0.5,
        });
        const buffer = await originalImage.getBufferAsync(Jimp.MIME_JPEG);
        await s3.uploadImage(job.image_preview, buffer);
    }
    catch (err) {
        console.log(err);
        return;
    }
}

module.exports = { inializeChannelBots: initializeChannelBots }
