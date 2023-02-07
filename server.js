require('dotenv').config({path: '.env'});
const express = require('express');
const { Client } = require('discord.js-selfbot-v13');
const _ = require('lodash');
const axios = require('axios');
const cors = require('cors');
const Jimp = require('jimp');
const { MongoClient, ObjectId } = require('mongodb');
const Bottleneck = require('bottleneck');
const s3 = require('./src/api/services/s3');
const discord = require('./src/api/services/discord');


const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3001',
}));

const PORT = process.env.PORT || 3000;

const defaultRoutes = require('./src/api/routes/routes');
const authRoutes = require('./src/api/routes/authRoutes');


//Routes
app.use('/', defaultRoutes);
app.use('/auth', authRoutes);


(async () => {
    await discord.initializeListenerClient();
    await discord.initializeChannelBots();
})();


/*function extractUUID(str) {
    // Use a regular expression to match the UUID
    const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i;
    const match = str.match(uuidRegex);
    // If a match is found, return the UUID
    if (match) {
        return match[0];
    }
    // If no match is found, return null
    return null;
}*/

/*app.get('/jobs/:job_id/status', async (req, res) => {
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
});*/

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


app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
