const nodemailer = require('nodemailer');
const { generateEmailToken, generatePasswordResetToken } = require('../auth/auth');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
    }
});



const sendVerificationEmail = async (user) => {
    try {
        const verificationToken = generateEmailToken(user);
        const url = `http://localhost:3001/verify/${verificationToken}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Email verification',
            html: `Click <a href="${url}">here</a> to verify your email`
        });
    }
    catch (err) {
        console.log(err);
    }
}

const sendPasswordResetEmail = async (user) => {
    try {
        const token = generatePasswordResetToken(user);
        const url = `http://localhost:3001/reset/${user._id}/${token}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Password reset',
            html: `Click <a href="${url}">here</a> to reset your password`
        });
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
}