const axios = require("axios");

const discordApi = axios.create({
    baseURL: 'https://discord.com/api/v9',
    timeout: 1000
});

module.exports = {discordApi}