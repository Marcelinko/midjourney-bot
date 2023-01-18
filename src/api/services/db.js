//exports functions for performing database operations such as inserting, updating and finding data
const { MongoClient } = require('mongodb');
const db = require('../../config/db');
const ErrorObject = require('../helpers/error').default
const User = require('../models/User').default;
const { encryptPassword } = require('../helpers/encryption');

const createUser = async (displayName, email, password) => {
    try {
        const client = await MongoClient.connect(db.url);
        const usersCollection = client.db(db.name).collection('users');
        const isEmailInUse = await usersCollection.findOne({ email });
        if (isEmailInUse) {
            throw new ErrorObject({
                message: 'User already exists',
                statusCode: 409
            })
        }
        const hashedPassword = await encryptPassword(password);
        const result = await usersCollection.insertOne({ display_name: displayName, email, password: hashedPassword });
        await client.close();
        return new User(result.insertedId, displayName, email);
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message
        });
    }
}

const getUser = async (email) => {
    try{
        const client = await MongoClient.connect(db.url);
        const usersCollection = client.db(db.name).collection('users');
        const user = await usersCollection.findOne({ email });
        if(!user){
            throw new ErrorObject({
                message: 'User not found',
                statusCode: 404
            });
        }
        return user;
    }
    catch(err){
        throw new ErrorObject({
            message: err.message
        });
    }
}

module.exports = {
    createUser,
    getUser
}