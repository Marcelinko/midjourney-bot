const { Client } = require("discord.js-selfbot-v13");
const { Channel } = require("../models/Channel");
const { Job, Status } = require("../models/Job");
const { Bot } = require("../models/Bot");
const BotConfig = require("../../config/bots");


const channels = [];
const midjourneyClients = [];
const jobQueue = [];


const createChannels = () => {

    console.log(BotConfig)

    for (let bot in BotConfig) {
        /*  //create client for every bot
          const client = new Client({ checkUpdate: false });

          //login client with token
          client.once("ready", () => {
              client.login(bot.).catch(err => console.log("clientLoginError: " + err));
              console.log(`Logged in as ${client.user.tag}`);
          });

          for (let channel in bot[chanelIds])
          //create new bot for channel
          const bot = new Bot(bot["accessToken"], client.sessionId);

          let channel =*/

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

module.exports = { createChannels }
