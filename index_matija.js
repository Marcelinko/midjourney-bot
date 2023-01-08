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

var jobs = [];
var queue = [];
var clients = [];

const createClients = () => {
    for (let i = 0; i < bots.length; i++) {
        const client = new Client({ checkUpdate: false });
        clients.push(client);
    }
}

createClients();

const PORT = process.env.PORT || 3000;

//TODO: FIX THIS
class Job {
    constructor(id, prompt, status, type) {
        this.id = id;
        this.prompt = prompt;
        this.status = status;
        this.type = type;
    }
}

class Bot {
    constructor(token) {
        this.token = token;
        this.jobs = [];
    }
    getToken() {
        return this.token;
    }
    setId(id) {
        this.id = id;
    }
    getId() {
        return this.id;
    }
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    getSessionId() {
        return this.sessionId;
    }
    addJob(job) {
        this.jobs.push(job);
    }
}

//selfbot accounts
let bots = [
    new Bot("MTA2MDk2NTI0MDM3Mzc3NjQ5NA.GxQrxh.atWXOlwuKh8WpJrBDnhyrRjJiy0KYELapiexPk"),
];

var bot = {
    id: 1,
    token: "MTA2MDk2NTI0MDM3Mzc3NjQ5NA.GxQrxh.atWXOlwuKh8WpJrBDnhyrRjJiy0KYELapiexPk",
    sessionId: null,
    jobs: [],
}

var job = {
    id: uuid.v4(),
    prompt: "test",
    status: "pending",//pending means it is in queue, in progress means it is being generated, completed means it is done
    type: "generation / upscale",
    startTime: Date.now(),
    endTime: Date.now(),
    url: '',
    botId: "1",
}

const loginClients = () => {
    for (let i = 0; i < clients.length; i++) {
        clients[i].once('ready', () => {
            console.log(`Logged in as ${clients[i].user.tag}`);
            bots[i].setId(i + 1);
            bots[i].setSessionId(clients[i].sessionId);
        });
        clients[i].login(bots[i].token);
    }
}

const createJob = (prompt) => {
    const job = {
        id: uuid.v4(),
        prompt,
        status: "pending",
    }
    //IN FUTURE CHECK IF CAPITAL LETTERS MATTER
    //check if there are any bots available
    for (let i = 0; i < bots.length; i++) {
        if (_.find(jobs, { bot: bots[i].id }).length < 3 && !_.find(jobs, { prompt: prompt, status: "in progress" })) {
            job.botId = bots[i].id;
            jobs.push(job);
            startGeneration(job, bots[i]);
            return job;
        }
    }
    //if no bots are available, add job to queue
    queue.push(job);
    return job;
}

const nextJob = () => {

}

const completeJob = (job) => {

}

const startGeneration = (job, bot) => {
    const data = {
        "type": 2,
        "application_id": "936929561302675456",
        "guild_id": "1059489287290245150",
        "channel_id": "1059500131428339873",
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
        "nonce": calculateNonce()
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
    //get position in queue
    return _.findIndex(queue, { id: job.id }) + 1;
}

const getJob = (id) => {
    return _.find(jobs, { id: id });
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

app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
    if (prompt.length > 100) return res.status(400).json({ error: 'Prompt too long' });
    const job = createJob(prompt.replace(/\*/g, ''));
    //if no bot was available, return position in queue
    if (!job.bot) {
        let position = getQueuePosition(job);
        return res.status(400).json({ job: job.id, status: job.status, position: position });
    }
    res.json({ id: job.id, status: job.status });
});

app.get('/jobs/:id/status', async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'No job id provided' });

    const job = getJob(id);
    if (!job) return res.status(400).json({ error: 'Job with id ' + id + ' not found' });
    if (job.status === "pending") {
        let position = getQueuePosition(job);
        return res.json({ status: job.status, queue_position: position });
    }
    else if (job.status === "in progress") {
        return res.json({ status: job.status });
    }
    else if (job.status === "completed") {
        return res.json({ status: job.status, url: job.url });
    }
});

clients[0].on('messageCreate', async message => {
    if (message.author.bot) {
        console.log("Jobs length: " + jobs.length);
        console.log("Queue length: " + queue.length);
    }
});

//loop array every 5 minutes and delete jobs that are older than 60 minutes

app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
loginClients();