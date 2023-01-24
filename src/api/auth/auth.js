const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '5m'
    });
}
const generateRefreshToken = (user) => {
    return jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30d'
    });
}

const generateEmailToken = (user) => {
    return jwt.sign({ _id: user._id }, process.env.EMAIL_TOKEN_SECRET, {
        expiresIn: '7d'
    });
}

const generatePasswordResetToken = (user) => {
    return jwt.sign({ _id: user._id, email: user.email }, process.env.PASSWORD_TOKEN_SECRET + user.password, {
        expiresIn: '10m'
    });
}

const validateAccessToken = (accessToken) => {
    return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
}

const validateRefreshToken = (refreshToken) => {
    return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
}

const validateEmailToken = (emailToken) => {
    return jwt.verify(emailToken, process.env.EMAIL_TOKEN_SECRET);
}

const validatePasswordResetToken = (passwordToken, user) => {
    return jwt.verify(passwordToken, process.env.PASSWORD_TOKEN_SECRET + user.password);
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateEmailToken,
    generatePasswordResetToken,
    validateAccessToken,
    validateRefreshToken,
    validateEmailToken,
    validatePasswordResetToken
}