const db = require('../services/db');
const validation = require('../helpers/validation');

const registerUser = async (req, res) => {
    const { display_name, email, password } = req.body;
    try {
        await validation.registerSchema.validateAsync(req.body);
        const user = await db.createUser(display_name, email, password);
        const jwt = require('jsonwebtoken');
        const emailToken = jwt.sign({ _id: user._id }, process.env.EMAIL_TOKEN_SECRET, {
            expiresIn: '1d'
        });

        console.log(emailToken);
        res.status(201).json(user);
    } catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

module.exports = {
    registerUser
}