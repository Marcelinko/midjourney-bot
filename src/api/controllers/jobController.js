const discord = require("../services/discord");
const validation = require('../helpers/validation');
const { Status } = require("../models/Job");

const createJob = async (req, res) => {
    const { prompt } = req.body;
    try {
        await validation.promptSchema.validateAsync(req.body);
        const job = discord.createJob(prompt);
        res.status(200).json({ jobId: job.jobId, status: Status.PENDING });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    createJob,
};
