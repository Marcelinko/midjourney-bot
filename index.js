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
const session_id = null;
const channel_id = "1059500131428339873";
//dodaj opcijo za vec botov in da se izbere kateri bot bo generiral sliko glede na queue posameznega bota
//dodaj profanity filter

let jobs = [];
let queue = [];
//simulacija baze
let completedJobs = [];

function startGeneration(job) {
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
            "Authorization": token
        }
    }
    axios.post('https://discord.com/api/v9/interactions', data, config).catch((err) => {
        console.log(err);
    });
}

function createJob(prompt) {
    const jobId = uuid.v4();
    var job = {
        id: jobId,
        prompt: prompt,
        status: "pending",
    };

    if (_.some(jobs, ['prompt', job.prompt]) || jobs.length >= 3) {
        queue.push(job);
        console.log("Job for " + prompt + " has been queued!");
        return job;
    }

    jobs.push(job);
    startGeneration(job);
    return job;
}

function getStringBetween(input) {
    const startIndex = input.indexOf("**");
    const endIndex = input.indexOf("**", startIndex + 1);
    if (startIndex !== -1 && endIndex !== -1) {
        return input.substring(startIndex + 2, endIndex);
    }
    return '';
}

function getJob(jobId) {
    let job = jobs.find(job => job.id === jobId);
    if (!job) {
        job = queue.find(job => job.id === jobId);
        if (!job)
            job = completedJobs.find(job => job.id === jobId);
    }
    return job;
}

function getQueuePosition(jobId) {
    return queue.findIndex(job => job.id === jobId) + 1;
}

function addFromQueueToJobs() {
    for (let i = 0; i < queue.length; i++) {
        if (!_.some(jobs, ['prompt', queue[i].prompt])) {
            jobs.push(queue[i]);
            startGeneration(queue[i]);
            _.remove(queue, queue[i]);
            break;
        }
    }
}

function completeJob(prompt, imageUrl, messageId) {
    let jobIndex = jobs.findIndex(job => job.prompt === getStringBetween(prompt));
    jobs[jobIndex].status = "completed";
    if (!imageUrl || !messageId)
        jobs[jobIndex].imageUrl = "https://cdn.discordapp.com/attachments/1059489287290245153/1060986517796958249/71508877-f391a980-2891-11ea-832c-db9f173586c0.png";
    else
        jobs[jobIndex].messageId = messageId;
    jobs[jobIndex].imageUrl = imageUrl;
    completedJobs.push(jobs[jobIndex]);
    jobs.splice(jobIndex, 1);
    console.log("Job for " + prompt + " has finished with message id " + messageId);
}

function calculateNonce(date = "now") {
    if (date === "now") {
        const unixts = Date.now();
    } else {
        const unixts = date.getTime();
    }
    return (unixts * 1000 - 1420070400000) * 4194304;
}

app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
    if (prompt.length > 100) return res.status(400).json({ error: 'Prompt too long' });
    //replace all * with nothing to get a clean prompt
    const job = createJob(prompt.replace(/\*/g, ''));

    res.json({ id: job.id });
});


app.get('/jobs/:id/status', async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'No job id provided' });
    const job = getJob(id);
    if (!job) {
        return res.json({ status: "error", error: "Job not found" });
    }
    if (job.status === "pending") {
        const queuePosition = getQueuePosition(id);
        return res.json({ queue_position: queuePosition, status: "pending" });
    }
    else if (job.status === "in progress") return res.json({ status: "in progress" });
    else if (job.status === "completed") {
        return res.json({ status: job.status, image_url: job.imageUrl });
    }
    else return res.json({ status: "error", error: "Something went wrong" });
});

client.on('messageCreate', async message => {
    if (message.author.bot) {
        console.log("Jobs length: " + jobs.length);
        console.log("Queue length: " + queue.length);
        if (_.some(jobs, ['prompt', getStringBetween(message.content)]) && _.some(jobs, ['status', "pending"])) {
            let jobIndex = jobs.findIndex(job => job.prompt === getStringBetween(message.content));
            jobs[jobIndex].status = "in progress";
            console.log("Job for " + message.content + " has begun!");
        }
        else if (_.some(jobs, ['prompt', getStringBetween(message.content)]) && _.some(jobs, ['status', "in progress"])) {
            completeJob(message.content, message.attachments.first().url, message.id);
            console.log(message.components[0]);
            console.log(message.components[0].components[0]);
            console.log(message.components[0].components[0].label);
            //process next job from queue
            if (queue.length > 0) {
                //rename to nextJob
                addFromQueueToJobs();
            }
            //else there are no more jobs to process
        }
    }
});


//funkcija pobere iz messsage message.components[0](prva vrsta kjer je upscale).components
//funkcija ki shrani url v bazo ko je slika generirana

app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
client.once('ready', () => console.log(`Logged in as ${client.user.username}`));
client.login(token);