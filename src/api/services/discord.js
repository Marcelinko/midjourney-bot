const { Client } = require("discord.js-selfbot-v13");
const Channel = require("../models/Channel");
const { Job, Status } = require("../models/Job");
const Bot = require("../models/Bot");
const BotConfig = require("../../config/bots");
const s3 = require("./s3");
const axios = require("./axios.js");
const io = require("./socket");

let bots = [];
let jobs = [];

const initializeBots = async () => {
    for (const botConfig of BotConfig) {

        //make new client for selfbot and log it in
        const client = new Client({ checkUpdate: false });
        await client.login(botConfig.accessToken);
        console.log(`Logged in as ${client.user.tag}`);

        //make list of new channels for current bot
        let channels = [];
        botConfig.channelIds.forEach(channelId => {
            channels.push(new Channel(channelId));
        });

        //create bot for client and add it to bot array
        let bot = new Bot(client, botConfig.accessToken, channels);
        //set bot for each channel
        bot.getChannels().forEach(c => c.setBot(bot));
        bots.push(bot);

    }
}


setInterval(function () {
    let jobArray = "jobArray: "
    let channelArray = "channelArray: "
    jobs.forEach(job => {
        jobArray = jobArray + job.getStatus() + " ";
    });

    bots.forEach(b => {b.channels.forEach(c => {channelArray = channelArray + c.getIsFree() + " ";})})

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

    if(firstQueuedJob){
        //find bot with the least jobs
        let freeChannelCount = 0;
        let leastOccupiedBot = null;
        for (let bot of bots){
            if(bot.getFreeChannelCount() > freeChannelCount){
                freeChannelCount = bot.getFreeChannelCount();
                leastOccupiedBot = bot;
            }
        }

        if(leastOccupiedBot){
            leastOccupiedBot.addJob(firstQueuedJob);
        }
    }

}, 1500);


const getFirstQueuedJob = () => {
    return jobs.find(job => { return job.getStatus() === Status.QUEUED });
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
    jobs.push(job);
    return job;
};
//Returns prompt from message



const getPromptFromMessage = (message) => {
    return message.match(/\*\*(.*?)\*\*/)[1];
};



// const saveGeneratedImage = (message, job) => {
//     //read photo from message
//     const imageUrl = message.attachments.first().url;
//     axios.downloadImage(imageUrl).then(res => {
//         s3.uploadImage(message.attachments.first().name, res.data).then(() => {
//             //const generatedImage = new GeneratedImage();
//             //db.createGeneratedImage(generatedImage).then(job.status = Status.READY);
//             //TODO: this goes to updateJobStatus
//             job.status = Status.READY;
//             io.emit(`job-${job.getJobId()}`, { status: job.getStatus() });
//         })
//     })
// }



module.exports = {
    createJob,
    initializeBots
}
