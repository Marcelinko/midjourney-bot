module.exports = class Bot {
    constructor(accessToken, sessionId) {
        this.accessToken = accessToken;
        this.sessionId = sessionId;
    }
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    getSessionId() {
        return this.sessionId;
    }

    getAccessToken(){
        return this.accessToken;
    }
}

