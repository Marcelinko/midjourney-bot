const jwt = require('jsonwebtoken');
const googleAuth = require('google-auth-library');
const ErrorObject = require('../helpers/error');
const OAuth2Client = new googleAuth.OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (user) => {
    try {
        return jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '5m'
        });
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Error while generating access token',
            statusCode: 500
        });
    }
}
const generateRefreshToken = (user) => {
    try {
        return jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '30d'
        });
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Error while generating refresh token',
            statusCode: 500
        });
    }
}

const generateEmailToken = (user) => {
    try {
        return jwt.sign({ _id: user._id }, process.env.EMAIL_TOKEN_SECRET, {
            expiresIn: '7d'
        });
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Error while generating email verification token',
            statusCode: 500
        });
    }
}

const generatePasswordResetToken = (user) => {
    try {
        return jwt.sign({ _id: user._id, email: user.email }, process.env.PASSWORD_TOKEN_SECRET + user.password, {
            expiresIn: '10m'
        });
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Error while generating password reset token',
            statusCode: 500
        });
    }
}

const validateAccessToken = (accessToken) => {
    try {
        return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Access token is invalid or expired',
            statusCode: 401
        });
    }
}

const validateRefreshToken = (refreshToken) => {
    try {
        return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Refresh token is invalid or expired',
            statusCode: 401
        });
    }
}

const validateEmailToken = (emailToken) => {
    try {
        return jwt.verify(emailToken, process.env.EMAIL_TOKEN_SECRET);
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Verification token is invalid or expired',
            statusCode: 401
        });
    }
}

const validatePasswordResetToken = (passwordToken, user) => {
    try {
        return jwt.verify(passwordToken, process.env.PASSWORD_TOKEN_SECRET + user.password);
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Access token is invalid or expired',
            statusCode: 401
        });
    }
}

const validateGoogleToken = async (idToken) => {
    try {
        const ticket = await OAuth2Client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if(payload.aud !== process.env.GOOGLE_CLIENT_ID){
            throw new ErrorObject({
                message: 'The audience does not match the client ID',
                statusCode: 401
            });
        }
        if(payload.iss !== 'accounts.google.com')
        {
            throw new ErrorObject({
                message: 'The issuer is not Google',
                statusCode: 401
            });
        }
        return payload;
    }
    catch (err) {
        throw new ErrorObject({
            message: 'Google token is invalid or expired',
            statusCode: 401
        });
    }
}


module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateEmailToken,
    generatePasswordResetToken,
    validateAccessToken,
    validateRefreshToken,
    validateEmailToken,
    validatePasswordResetToken,
    validateGoogleToken
}