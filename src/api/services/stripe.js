const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const storeItems = new Map([
    [1, { priceInCents: 50, name: 'Tokens' }],
    [2, { priceInCents: 2500, name: 'Phone case' }],
]);

const createSession = async (items) => {
    try{
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => {
                const storeItem = storeItems.get(item.id);
                return {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: storeItem.name,
                        },
                        unit_amount: storeItem.priceInCents,
                    },
                    quantity: item.quantity,
                };
            }),
            mode: 'payment',
            success_url: 'http://localhost:3001/success',
            cancel_url: 'http://localhost:3001/cancel',
        });
        return session;
    }
    catch(err){
        console.log(err)
    }
};

module.exports = {
    createSession,
};