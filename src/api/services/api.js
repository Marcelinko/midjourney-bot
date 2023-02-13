
const {discordApi} = require("./axios");
const axios = require("axios");

const sendInteraction = (job, channel) => {
    const data = {
        "type": 2,
        "application_id": process.env.MIDJOURNEY_ID,
        "guild_id": process.env.SERVER_ID,
        "channel_id": channel.channelId,
        "session_id": channel.bot.getSessionId(),
        "data": {
            "version": process.env.MIDJOURNEY_VERSION,
            "id": process.env.MIDJOURNEY_DATA_ID,
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
        headers: {"Authorization": channel.bot.getAccessToken()}
    }
    discordApi.post("/interactions", data, config).catch(err => console.log("discordApiError: " + err))
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


module.exports = {sendInteraction}
