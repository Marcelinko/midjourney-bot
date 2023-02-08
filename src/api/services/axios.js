const axios = require("axios");

const discordApi = axios.create({
    baseURL: 'https://discord.com/api/v9',
    timeout: 1000
});

const downloadImage = async (url) => {
    try {
        const response = await axios({
            method: "GET",
            url: url,
            responseType: "arraybuffer",
        });

        return response
    } catch (err) {
        console.log("Error downloading image: " + err)
    }
};



module.exports = {discordApi, downloadImage}