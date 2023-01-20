const nodemailer = require('nodemailer');

let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: 'pliscancer@gmail.com',
        pass: 'mihanimadlife123'
    }
})