//exports functions for performing database operations such as inserting, updating and finding data
const { MongoClient, ObjectId } = require('mongodb');
const db = require('../../config/db');
const ErrorObject = require('../helpers/error');
const User = require('../models/User');
const { encryptPassword } = require('../helpers/encryption');

const createUser = async (displayName, email, password) => {
    try {
        const client = await MongoClient.connect(db.url);
        const usersCollection = client.db(db.name).collection('users');
        const isEmailInUse = await usersCollection.findOne({ email });
        if (isEmailInUse) {
            await client.close();
            throw new ErrorObject({
                message: 'User already exists',
                statusCode: 409
            });
        }
        const hashedPassword = await encryptPassword(password);
        const result = await usersCollection.insertOne({ display_name: displayName, email, password: hashedPassword, verified: false });
        await client.close();
        return new User(result.insertedId, displayName, email);
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

const getUserByEmail = async (email) => {
    try {
        const client = await MongoClient.connect(db.url);
        const usersCollection = client.db(db.name).collection('users');
        const user = await usersCollection.findOne({ email });
        if (!user) {
            await client.close();
            throw new ErrorObject({
                message: 'User not found',
                statusCode: 404
            });
        }
        await client.close();
        return user;
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

const getUserById = async (user_id) => {
    try {
        const client = await MongoClient.connect(db.url);
        const usersCollection = client.db(db.name).collection('users');
        const user = await usersCollection.findOne({ _id: ObjectId(user_id) });
        if (!user) {
            await client.close();
            throw new ErrorObject({
                message: 'User not found',
                statusCode: 404
            });
        }
        await client.close();
        return user;
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

const setRefreshToken = async (user_id, refreshToken) => {
    try {
        const client = await MongoClient.connect(db.url);
        const refreshTokensCollection = client.db(db.name).collection('refresh_tokens');
        await refreshTokensCollection.updateOne({ user_id }, { $set: { refresh_token: refreshToken } }, { upsert: true });
        await client.close();
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

const getRefreshToken = async (user_id) => {
    try {
        const client = await MongoClient.connect(db.url);
        const refreshTokensCollection = client.db(db.name).collection('refresh_tokens');
        const tokenObject = await refreshTokensCollection.findOne({ user_id: ObjectId(user_id) });
        if (!tokenObject) {
            await client.close();
            throw new ErrorObject({
                message: 'Refresh token not found',
                statusCode: 404
            });
        }
        await client.close();
        return tokenObject;
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

const deleteRefreshToken = async (refreshToken) => {
    try {
        const client = await MongoClient.connect(db.url);
        const refreshTokensCollection = client.db(db.name).collection('refresh_tokens');
        await refreshTokensCollection.deleteOne({ refresh_token: refreshToken });
        await client.close();
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

const verifyUser = async (user_id) => {
    try {
        const client = await MongoClient.connect(db.url);
        const usersCollection = client.db(db.name).collection('users');
        await usersCollection.updateOne({ user_id }, { $set: { verified: true } });
        await client.close();
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    setRefreshToken,
    getRefreshToken,
    deleteRefreshToken,
    verifyUser
}