const db = require('../services/db');
const validation = require('../helpers/validation');
const auth = require('../auth/auth');
const { validatePassword } = require('../helpers/encryption');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/nodemailer');

//Middleware to authenticate user
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

//Register user with email and password
const registerUser = async (req, res) => {
    const { display_name, email, password } = req.body;
    try {
        await validation.registerSchema.validateAsync(req.body);
        const user = await db.createUserEmailPassword(display_name, email, password);
        await sendVerificationEmail(user);
        res.status(201).json(user);
    } catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

//Login user with email and password
const loginUserEmailPassword = async (req, res) => {
    const { email, password } = req.body;
    try {
        await validation.loginSchema.validateAsync(req.body);
        const user = await db.getUserByEmail(email);
        if (!user.password) {
            return res.status(401).json({ error: 'This account requires password, but no password is associated with this account. Please Log in using your Google account' });
        }
        const isPasswordValid = await validatePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }
        const accessToken = auth.generateAccessToken(user);
        const refreshToken = auth.generateRefreshToken(user);
        await db.createRefreshToken(user._id, refreshToken);
        res.status(200).json({ user_id: user._id, display_name: user.display_name, access_token: accessToken, refresh_token: refreshToken });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

//Login user with google account
const loginUserGoogle = async (req, res) => {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ error: 'No id token provided' });
    try {
        const decoded = await auth.validateGoogleToken(id_token);
        const user = await db.createUserGoogle(decoded.name, decoded.email);
        const accessToken = auth.generateAccessToken(user);
        const refreshToken = auth.generateRefreshToken(user);
        await db.createRefreshToken(user._id, refreshToken);
        res.status(200).json({ user_id: user._id, display_name: user.display_name, access_token: accessToken, refresh_token: refreshToken });
    }
    catch (err) {
        res.json({ error: err.message });
    }
}

//Send email with reset password link
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        await validation.emailSchema.validateAsync(req.body);
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'User with this email does not exist' });
        }
        await sendPasswordResetEmail(user);
        res.status(200).json({ message: 'Reset link sent to email' });
    } catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

//Reset password
const resetPassword = async (req, res) => {
    const { user_id, token } = req.params;
    const { password } = req.body;
    try {
        await validation.newPasswordSchema.validateAsync(req.body);
        const user = await db.getUserById(user_id);
        auth.validatePasswordResetToken(token, user);
        await db.updatePassword(user_id, password);
        res.status(200).json({ message: 'Password successfuly updated' });
    } catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

//Logout user from current device
const logoutUser = async (req, res) => {
    const { refresh_token } = req.body;
    try {
        await validation.refreshTokenSchema.validateAsync(req.body);
        await db.deleteRefreshToken(req.user._id, refresh_token);
        res.status(200).json({ messsage: 'Successfully logged out' });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

//Logout user from all devices, send message that it may take up to 5 minutes to logout from all devices
const logoutUserAllDevices = async (req, res) => {
    try {
        await db.deleteRefreshTokens(req.user._id);
        res.status(200).json({ messsage: 'Successfully logged out from all devices' });
    }
    catch (err) {
        if (err.isJoi) {
            return res.status(400).json({ error: err.message });
        }
        res.status(err.statusCode).json({ error: err.message });
    }
}

//Refresh access token
const refreshToken = async (req, res) => {
    const { refresh_token } = req.body;
    try {
        await validation.refreshTokenSchema.validateAsync(req.body);
        const tokenObject = await db.getRefreshToken(refresh_token);
        if (!tokenObject) {
            return res.status(400).json({ error: 'Invalid refresh token' });
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

//Verify email
const verifyEmail = async (req, res) => {
    try {
        const token = req.params.token;
        const decoded = auth.validateEmailToken(token);
        await db.verifyUser(decoded._id);
        res.status(200).json({ message: 'Email verified' });
    }
    catch (err) {
        res.status(err.statusCode).json({ error: err.message });
    }
}

module.exports = {
    authenticate,
    registerUser,
    loginUserEmailPassword,
    loginUserGoogle,
    forgotPassword,
    resetPassword,
    logoutUser,
    logoutUserAllDevices,
    refreshToken,
    verifyEmail
}