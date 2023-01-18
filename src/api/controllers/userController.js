const db = require('../services/db');
const validation = require('../helpers/validation');
const auth = require('../auth/auth');

const registerUser = async (req, res, next) => {
    const { displayName, email, password } = req.body;
    try {
        const validated = await validation.authSchema.validateAsync(req.body);
        const user = await db.createUser(displayName, email, password);
        res.status(201).json(user);
    }
    catch (err) {
        res.status(err.statusCode).json({ error: err.message });
    }
}

const loginUser = async (req, res, next) => {
    const {email, password} = req.body;
    try{
        const validated = await validation.authSchema.validateAsync(req.body);
        
    }
    catch(err){
        
    }
}

module.exports = {
    registerUser
}