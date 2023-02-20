module.exports = class Bot {
    constructor(client, accessToken, channels) {
        this.accessToken = accessToken;
        this.client = client;
        this.freeChannelCount = channels.length;
        this.channels = channels;
        client.on('messageCreate', this.sendMessageToChannel.bind(this));
    }

    getSessionId() {
        return this.sessionId;
    }

    getAccessToken(){
        return this.accessToken;
    }

    getChannels(){
        return this.channels;
    }

    getFreeChannelCount(){
        return this.freeChannelCount;
    }

    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }

    setAccessToken(accessToken){
        this.accessToken = accessToken;
    }

    addJob(job){
        this.freeChannelCount -= 1;
        const channel = this.channels.find(c => c.getIsFree() === true);
        channel.addJob(job);
    }

    removeJob(){
        this.freeChannelCount += 1;
    }

    sendMessageToChannel(message) {
        //check if this midjourney produced the message
        if(message.author.id === process.env.MIDJOURNEY_ID) {
            let channelId = message.channelId;
            let channel = this.channels.find(c => c.getChannelId() === channelId );
            if (channel) {
                channel.handleMessage(message);
            }
        }
    }

}

