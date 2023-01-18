const authenticate = async (req, res, next) => {
    try {
        const accessToken = req.header('Authorization');
        if (!accessToken) return res.status(401).json({ error: 'No access token provided' });
        const client = await MongoClient.connect(url);
        const users = client.db("testDb").collection("users");
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = await users.findOne({ _id: ObjectId(decoded.id) });
        await client.close();
        if (!user) return res.status(404).json({ error: 'User not found' });
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid access token / Access token expired' });
    }
}

const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });
}
const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '30d'
    });
}

module.exports = {
    authenticate,
    generateAccessToken,
    generateRefreshToken
}