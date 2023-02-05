const Bot = require("../models/Bot");
const {Client} = require("discord.js-selfbot-v13");
let bots = [
    new Bot(process.env.BOT_1_AUTH, process.env.BOT_1_CHANNEL),
];

const createClients = () => {
    for (let i = 0; i < bots.length; i++) {
        const client = new Client({ checkUpdate: false });
        clients.push(client);
    }
}