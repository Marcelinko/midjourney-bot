const { createSession } = require('../services/stripe');
const createCheckoutSession = async (req, res) => {
    const { items } = req.body;
    try {
        const session = await createSession(items);
        res.status(200).json({ url: session.url });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    createCheckoutSession,
};
