const db = require('../services/db');
const validation = require('../helpers/validation');
const auth = require('../auth/auth');
const { validatePassword } = require('../helpers/encryption');

const authenticate = async (req, res, next) => {
    try {
        const accessToken = req.header('Authorization');
        if (!accessToken) return res.status(400).json({ error: 'No access token provided' });
        const decoded = auth.validateAccessToken(accessToken);
        const user = await db.getUserById(decoded._id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid access token' });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        await validation.loginSchema.validateAsync(req.body);
        const user = await db.getUserByEmail(email);
        const isPasswordValid = await validatePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }
        const isUserVerified = user.verified;
        if (!isUserVerified) {
            return res.status(401).json({ error: 'Please verify your email' });
        }
        const accessToken = auth.generateAccessToken(user);
        const refreshToken = auth.generateRefreshToken(user);
        await db.setRefreshToken(user._id, refreshToken);
        res.status(200).json({ user_id: user._id, access_token: accessToken, refresh_token: refreshToken });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

const logoutUser = async (req, res) => {
    const { user_id, refresh_token } = req.body;
    try {
        await validation.refreshTokenSchema.validateAsync(req.body);
        const tokenObject = await db.getRefreshToken(user_id);
        if (tokenObject.refresh_token != refresh_token) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        await db.deleteRefreshToken(refresh_token);
        res.status(200).json({ messsage: 'Successfully logged out' });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

const refreshToken = async (req, res) => {
    const { user_id, refresh_token } = req.body;
    try {
        await validation.refreshTokenSchema.validateAsync(req.body);
        const tokenObject = await db.getRefreshToken(user_id);
        if (tokenObject.refresh_token != refresh_token) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        const decoded = auth.validateRefreshToken(refresh_token);
        const newAccessToken = auth.generateAccessToken(decoded);
        res.status(200).json({ access_token: newAccessToken });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

const verifyEmail = async (req, res) => {
    try {
        const token = req.params.token;
        const decoded = auth.verifyEmail(token);
        await db.verifyUser(decoded._id);
        res.status(200).json({message: 'Email verified'});
        //return res.redirect('https://localhost:3001/login');
    }
    catch (err) {
        res.status(400).json({ error: 'Could not verify email' });
    }
}

module.exports = {
    authenticate,
    loginUser,
    logoutUser,
    refreshToken,
    verifyEmail,
}