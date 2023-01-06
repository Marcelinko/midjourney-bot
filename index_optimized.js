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

const client = new Client({ checkUpdate: false });

const PORT = process.env.PORT || 3000;
const token = 'MTA2MDk2NTI0MDM3Mzc3NjQ5NA.GxQrxh.atWXOlwuKh8WpJrBDnhyrRjJiy0KYELapiexPk';

//TODO: FIX THIS
class Job {
    constructor() {
        this.id = id;
        this.prompt = prompt;
        this.status = status;
        this.type = type;
    }
}

let bots = [
    {
        id: "1",
        token: "MTA2MDk2NTI0MDM3Mzc3NjQ5NA.GxQrxh.atWXOlwuKh8WpJrBDnhyrRjJiy0KYELapiexPk",
        //channel_id: maybe seperate channel for each bot
        //session_id: maybe seperate session for each bot
    }
];

var job = {
    id: uuid.v4(),
    prompt: "test",
    status: "pending",//pending means it is in queue, in progress means it is being generated, completed means it is done
    type: "generation/upscale",
    startTime: Date.now(),
    endTime: Date.now(),
    url: '',
    botId: "1",
}

var jobs = [];
var queue = [];

const createJob = (prompt) => {
    const job = {
        id: uuid.v4(),
        prompt,
        status: "pending",
    }
    //IN FUTURE CHECK IF CAPITAL LETTERS MATTER
    //check if there are any bots available
    let botAvailable = false;
    for (let i = 0; i < bots.length; i++) {
        if (_.find(jobs, { bot: bots[i].id }).length < 3 && !_.find(jobs, { prompt: prompt, status: "in progress" })) {
            job.bot = bots[i].id;
            jobs.push(job);
            startGeneration(job, bots[i]);
            botAvailable = true;
            return job;
        }
    }
    //if no bots are available, add job to queue
    if (!botAvailable) {
        queue.push(job);
    }
    return job;
}

const nextJob = () => {

}

const startGeneration = (job, bot) => {
    const data = {
        "type": 2,
        "application_id": "936929561302675456",
        "guild_id": "1059489287290245150",
        "channel_id": "1059500131428339873",
        "session_id": "5daf044c2d01d5786e7caa5348cfdc92",
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

client.on('messageCreate', async message => {
    if (message.author.bot) {
        console.log("Jobs length: " + jobs.length);
        console.log("Queue length: " + queue.length);

    }
});
//loop array every 5 minutes and delete jobs that are older than 60 minutes

app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
client.once('ready', () => console.log(`Logged in as ${client.user.username}`));
client.login(token);