require('dotenv').config();
const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const _ = require('lodash');
const axios = require('axios');
const cors = require('cors');
const Jimp = require('jimp');
const { MongoClient, ObjectId } = require('mongodb');
const Bottleneck = require('bottleneck');
const Job = require('./src/api/models/Job');
const s3 = require('./src/api/services/s3');

const discord = require('./src/api/services/discord');


const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 5000
});

// setInterval(() => {
//     bots.forEach(bot => {
//         const jobs = bot.getJobs();
//         for (let i = 0; i < jobs.length; i++) {
//             const job = jobs[i];
//             if (job.status === "pending") {
//                 const jobStartTime = moment(job.start_time);
//                 const now = moment();
//                 const seconds = moment.duration(now.diff(jobStartTime)).asSeconds();
//                 if (seconds > 30) {
//                     bot.removeJob(i);
//                     console.log(`Job ${job.job_id} with prompt ${job.prompt} removed after 60 seconds due to an error`);
//                     processNextJob();
//                 }
//             }
//         }
//     })
// }, 10000)

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3001',
}));

const PORT = process.env.PORT || 3000;



const startGenerationTest = (job, bot) => {
    const data = {
        "type": 2,
        "application_id": "1063745303267790858",//midjourney 936929561302675456
        "guild_id": process.env.SERVER_ID,
        "channel_id": bot.getChannel(),
        "session_id": bot.getSessionId(),
        "data": {
            "version": "1063765617464848384",//994261739745050686
            "id": "1063761652580888646",//938956540159881230
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

const startGeneration = (job, bot) => {
    const data = {
        "type": 2,
        "application_id": "936929561302675456",
        "guild_id": process.env.SERVER_ID,
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

const upscaleImage = (job, bot) => {
    const data = {
        "type": 3,
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

const getStringBetween = (input) => {
    const startIndex = input.indexOf("**");
    const endIndex = input.indexOf("**", startIndex + 1);
    if (startIndex !== -1 && endIndex !== -1) {
        return input.substring(startIndex + 2, endIndex);
    }
    return '';
}

const { authenticate, registerUser, loginUserEmailPassword, logoutUser, refreshToken, resetPassword, verifyEmail, forgotPassword, logoutUserAllDevices, loginUserGoogle } = require('./src/api/controllers/authController');
const { createCheckoutSession } = require('./src/api/controllers/stripeController');

//this should be under auth/google, login, register...
app.post('/register', registerUser);
app.post('/google', loginUserGoogle);
app.post('/login', loginUserEmailPassword);
app.delete('/logout', authenticate, logoutUser);
app.delete('/logout-all', authenticate, logoutUserAllDevices);
app.post('/refresh-token', refreshToken);
app.post('/forgot-password', forgotPassword);
app.post('/reset-password/:user_id/:token', resetPassword);
app.get('/verify/:token', verifyEmail);

app.post('/checkout', createCheckoutSession);

app.get('/test', authenticate, (req, res) => {
    res.send("Ok");
});


app.post('/generate', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
    if (prompt.length > 100) return res.status(400).json({ error: 'Prompt too long' });
    const job = createJob(prompt.replace(/\*/g, ''));
    processJob(job);

    return res.json({ job_id: job.job_id, status: job.status });
});

function extractUUID(str) {
    // Use a regular expression to match the UUID
    const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
    const match = str.match(uuidRegex);
    // If a match is found, return the UUID
    if (match) {
        return match[0];
    }
    // If no match is found, return null
    return null;
}

app.get('/jobs/:job_id/status', async (req, res) => {
    const { job_id } = req.params;
    if (!job_id) return res.status(400).json({ error: 'No job id provided' });

    const job = await getJob(ObjectId(job_id));

    if (!job) {
        return res.status(400).json({ error: 'Job not found' });
    }
    if (job.status === "pending" || job.status === "in progress" || job.status === "processing") {
        return res.json({ status: job.status });
    }
    else if (job.status === "queued") {
        let queuePosition = getQueuePosition(job);
        return res.json({ status: job.status, queue_position: queuePosition });
    }
    else if (job.status === "completed") {
        const imageUrl = await getImagePreviewUrl(job_id);
        return res.json({ status: job.status, image_url: imageUrl });
    }
    res.json({ status: "error", message: "Something went wrong" });
});

const getImagePreviewUrl = async (job_id) => {
    try {
        const client = await MongoClient.connect(url);
        const collection = client.db("testDb").collection("jobs");
        const result = await collection.findOne({ _id: ObjectId(job_id) });
        await client.close();
        const image_url = await s3.getImageUrl(result.image_preview)
        console.log(image_url);
        return image_url;
    }
    catch (err) {
        console.log(err);
        return;
    }
}

const CompleteJob = async (bot, index, message) => {
    let job = bot.getJobs()[index];
    job.image_url = message.attachments.first().url;
    job.status = "completed";
    job.messageId = message.id;
    job.complete_time = new Date();
    job.image_preview = extractUUID(message.attachments.first().name);
    await insertJob(job);
    await uploadPreviewImage(job);
    bot.removeJob(index);
    processNextJob();
}

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

const insertJob = async (job) => {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db("testDb");
        const jobs = db.collection("jobs");
        job._id = job.job_id;
        await jobs.insertOne(job);
        await client.close();
    }
    catch (err) {
        console.log(err);
    }
}

//first login all clients then listen to port
app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
// loginClients();