const { Client } = require("discord.js-selfbot-v13");
const Channel = require("../models/Channel");
const { Job, Status } = require("../models/Job");

const channels = [];
const clients = [];
const queue = [];

const startGeneration = (job, bot, channelId) => {
    const data = {
        "type": 2,
        "application_id": "936929561302675456",
        "guild_id": process.env.SERVER_ID,
        "channel_id": channelId,
        "session_id": bot.getSessionId(),
        "data": {
            "version": "1071810428067397754",
            "id": "1071810428067397753",
            "name": "imagine",
            "type": 1,
            "options": [
                {
                    "type": 3,
                    "name": "prompt",
                    "value": job.prompt
                }
            ]
        },
    }

    const config = {
        headers: {
            "Authorization": bot.getToken()
        }
    }

    return axios.post('https://discord.com/api/v9/interactions', data, config).catch((err) => {
        console.log(err);
    });
}

const bots = [
    {
        "accessToken": "MTA3MDMyOTgxMDg2MzI3NjA2NA.GKd9zF._3oUM8x2Sr8oKAFPUMl0x05pj6SaGkpOnxNxuc",
        "chanelIds": [
            "1070333461539336262",
            "1071837327015550996",
            "1071837375027761312"
        ]
    },
    // {
    //     "accessToken": "MTA3MDMyOTgxMDg2MzI3NjA2NA.GKd9zF._b9gj6v1l6k8c6b2j6g2",
    //     "chanelIds": [
    //         "1070333461539336262",
    //         "1071837327015550996",
    //         "1071837375027761312"
    //     ]
    // }
]

const createClients = () => {
    for (let i = 0; i < bots.length; i++) {
        const client = new Client({ checkUpdate: false });
        clients.push(client);
    }
}

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
        queue.push(job);
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
    //if no bots are available, add job to queue
    job.status = "queued";
    queue.push(job);
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
});
