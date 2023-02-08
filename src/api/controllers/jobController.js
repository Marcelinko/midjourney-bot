const discord = require("../services/discord");
const validation = require('../helpers/validation');
const {Job} = require("../models/Job");

const createJob = async (req, res) => {
    const { prompt } = req.body;
    try {
        await validation.promptSchema.validateAsync(req.body);
        const job = await new Job(prompt)
        await discord.addJobToJobs(job);
        res.status(200).json({ job_id: job.job_id, status: job.status });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    createJob
};
