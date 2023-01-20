const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });
}
const generateRefreshToken = (user) => {
    return jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30d'
    });
}

const validateAccessToken = (accessToken) => {
    return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
}

const validateRefreshToken = (refreshToken) => {
    return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
}

const verifyEmail = (token) => {
    return jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    validateAccessToken,
    validateRefreshToken,
    verifyEmail,
}