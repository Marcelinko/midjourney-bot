module.exports = class Bot {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.sessionId = null;
    }
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
    getSessionId() {
        return this.sessionId;
    }
}

