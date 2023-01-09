const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('discord.js-selfbot-v13');
const uuid = require('uuid');
const _ = require('lodash');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

var clients = [];
var queue = [];


//simulacija baze
var completedJobs = [];

//TODO: FIX THIS
class Job {
    constructor(id, prompt) {
        this.id = id;
        this.prompt = prompt;
        this.status = "pending";
        this.startTime = new Date();
    }
    setStatus(status) {
        this.status = status;
    }
}

class Bot {
    constructor(token, channel) {
        this.token = token;
        this.channel = channel;
        this.jobs = [];
    }
    getToken() {
        return this.token;
    }
    getChannel() {
        return this.channel;
    }
    addJob(job) {
        this.jobs.push(job);
    }
    removeJob(index) {
        this.jobs.splice(index, 1);
    }
    getJobs() {
        return this.jobs;
    }
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    getSessionId() {
        return this.sessionId;
    }
}

//selfbot accounts, each selfbot has its own channel
let bots = [
    new Bot("MTA2MDk2NTI0MDM3Mzc3NjQ5NA.GxQrxh.atWXOlwuKh8WpJrBDnhyrRjJiy0KYELapiexPk", "1061379178001342515"),
    //new Bot("MTA1ODY5NzY0NDI3MDE2NjA2Nw.GslWzT.yTii4Zud7qo8LYXFhvNZi6N5FcvfHu-f47eG7I", "1061379237346562189"),
];

const createClients = () => {
    for (let i = 0; i < bots.length; i++) {
        const client = new Client({ checkUpdate: false });
        clients.push(client);
    }
}

createClients();

const PORT = process.env.PORT || 3000;

const loginClients = () => {
    for (let i = 0; i < clients.length; i++) {
        clients[i].once('ready', () => {
            console.log(`Logged in as ${clients[i].user.tag}`);
            bots[i].setSessionId(clients[i].sessionId);
        });
        clients[i].login(bots[i].token);
    }
}

//check if bot is available
isBotAvailable = (bot, job) => {
    //if bot has less than 3 jobs and the prompt is not already in jobs of bot
    if (bot.getJobs().length < 3 && !_.find(bot.getJobs(), { prompt: job.prompt })) {
        console.log("Bot has " + bot.getJobs().length + " jobs");
        console.log("Prompt was " + job.prompt);
        return true;
    }
    console.log("Job with prompt " + job.prompt + " is already in progress");
    return false;
}

//create job with prompt
createJob = (prompt) => {
    const job = new Job(uuid.v4(), prompt);
    console.log("Created a new job \n" + job);
    return job;
}

//process job
const processJob = (job) => {
    //check if there are any bots available
    for (let i = 0; i < bots.length; i++) {
        if (isBotAvailable(bots[i], job)) {
            bots[i].addJob(job);
            startGeneration(job, bots[i]);
            console.log("Started generation " + job.prompt + " on bot " + i);
            return job;
        }
    }
    //if no bots are available, add job to queue
    queue.push(job);
    return job;
}

const getJob = (id) => {
    for (let i = 0; i < bots.length; i++) {
        let job = _.find(bots[i].getJobs(), { id: id });
        if (job) {
            return job;
        }
        else {
            let job = _.find(queue, { id: id });
            if (job) {
                return job;
            }
            else {
                let job = _.find(completedJobs, { id: id });
                if (job) {
                    return job;
                }
            }
        }
    }
    return null;
}

const startGeneration = (job, bot) => {
    const data = {
        "type": 2,
        "application_id": "936929561302675456",
        "guild_id": "1059489287290245150",
        "channel_id": bot.getChannel(),
        "session_id": bot.getSessionId(),
        "data": {
            "version": "994261739745050686",
            "id": "938956540159881230",
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
        //"nonce": calculateNonce()
    }

    const config = {
        headers: {
            "Authorization": bot.getToken()
        }
    }

    axios.post('https://discord.com/api/v9/interactions', data, config).catch((err) => {
        console.log(err);
    });
}

const upscaleImage = (job, bot) => {
    const data = {
        "type": 3,
        "nonce": "1061018742760144896",//have the generator so
        "guild_id": "1059489287290245150",//id of server
        "channel_id": "1059500131428339873",//id of text channel
        "message_flags": 0,
        "message_id": "1061014229156646922",//id of message where group of 4 images are
        "application_id": "936929561302675456",//id of midjourney bot
        "session_id": "daadb0a30aef6a75ad07d879fa17140e",//session id of user
        "data": {
            "component_type": 2,
            "custom_id": "MJ::JOB::upsample::4::e3477f97-0231-4298-b01d-a243a61068a8"//nek unique id shrani v job in potem custom_id dodaj MJ::JOB::upsample::1-4::id
        }
    }

    const config = {
        headers: {
            "Authorization": bot.token
        }
    }
    //on frontend add message IF MESSAGE IS PENDING AND YOU ARE NOT IN QUEUE FOR OVER A MINUTE TRY CALLING AGAIN
    axios.post('https://discord.com/api/v9/interactions', data, config).catch((err) => {
        console.log(err);
    });
}

const getQueuePosition = (job) => {
    return _.findIndex(queue, { id: job.id }) + 1;
}

const getStringBetween = (input) => {
    const startIndex = input.indexOf("**");
    const endIndex = input.indexOf("**", startIndex + 1);
    if (startIndex !== -1 && endIndex !== -1) {
        return input.substring(startIndex + 2, endIndex);
    }
    return '';
}

const calculateNonce = () => {
    const unixts = Date.now();
    return (unixts * 1000 - 1420070400000) * 4194304;
}

app.post('/generate', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
    if (prompt.length > 100) return res.status(400).json({ error: 'Prompt too long' });
    const job = createJob(prompt.replace(/\*/g, ''));
    processJob(job);

    return res.json({ id: job.id, status: job.status });
});

app.get('/jobs/:id/status', (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'No job id provided' });

    const job = getJob(id);
    //if job is not found, check if it is in completed jobs
    if (!job) {
        return res.status(400).json({ error: 'Job not found' });
    }
    if (job.status === "pending") {
        let position = getQueuePosition(job);
        return res.json({ status: job.status, queue_position: position });
    }
    else if (job.status === "in progress") {
        return res.json({ status: job.status });
    }
    else if (job.status === "completed") {
        return res.json({ status: job.status, image_url: job.image_url });
    }
    res.json({ status: "error", message: "Something went wrong" });
});

clients[0].on('messageCreate', async message => {
    //means that midjourney has sent a message
    //if message author is midjourney bot
    if (message.author.bot) {  
        //we loop through selfbots
        bots.forEach(bot => {
            //if message is sent in the same channel as selfbot
            if (bot.getChannel() === message.channelId) {
                let job = _.find(bot.getJobs(), { prompt: getStringBetween(message.content) });
                let index = bot.getJobs().findIndex(job => job.prompt === getStringBetween(message.content));
                if (job) {
                    if (job.status === "pending") {
                        job.status = "in progress";
                        bot.getJobs()[index] = job;
                    }
                    else if (job.status === "in progress") {
                        job.status = "completed";
                        job.messageId = message.id;
                        job.image_url = message.attachments.first().url;
                        completedJobs.push(job);
                        bot.removeJob(index);
                        if (queue.length > 0) {
                            processJob(queue[0]);
                        }
                    }
                }
            }
        });
    }
});

//loop array every 5 minutes and delete jobs that are older than 60 minutes

app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
loginClients();