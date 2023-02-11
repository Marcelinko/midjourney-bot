const io = require('socket.io')({
    cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
    }
});

module.exports = io