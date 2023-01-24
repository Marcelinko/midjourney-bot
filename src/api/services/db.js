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
        const result = await usersCollection.insertOne({ display_name: displayName, email, password: hashedPassword, tokens: 3, verified: false });
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

const updatePassword = async (user_id, password) => {
    try {
        const client = await MongoClient.connect(db.url);
        const usersCollection = client.db(db.name).collection('users');
        const hashedPassword = await encryptPassword(password);
        await usersCollection.updateOne({ _id: ObjectId(user_id) }, { $set: { password: hashedPassword } });
        await client.close();
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

const createRefreshToken = async (user_id, refreshToken) => {
    try {
        const client = await MongoClient.connect(db.url);
        const refreshTokensCollection = client.db(db.name).collection('refresh_tokens');
        await refreshTokensCollection.insertOne({ user_id, refresh_token: refreshToken });
        await client.close();
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
        await refreshTokensCollection.updateOne({ user_id, refresh_token: refreshToken }, { $set: { refresh_token: refreshToken } }, { upsert: true });
        await client.close();
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

const getRefreshToken = async (refreshToken) => {
    try {
        const client = await MongoClient.connect(db.url);
        const refreshTokensCollection = client.db(db.name).collection('refresh_tokens');
        const tokenObject = await refreshTokensCollection.findOne({ refresh_token: refreshToken });
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

const deleteRefreshToken = async (user_id, refreshToken) => {
    try {
        const client = await MongoClient.connect(db.url);
        const refreshTokensCollection = client.db(db.name).collection('refresh_tokens');
        await refreshTokensCollection.deleteOne({ user_id, refresh_token: refreshToken });
        await client.close();
    }
    catch (err) {
        throw new ErrorObject({
            message: err.message,
            statusCode: err.statusCode
        });
    }
}

const deleteRefreshTokens = async (user_id) => {
    try {
        const client = await MongoClient.connect(db.url);
        const refreshTokensCollection = client.db(db.name).collection('refresh_tokens');
        await refreshTokensCollection.deleteMany({ user_id });
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
        const user = await usersCollection.findOne({ _id: ObjectId(user_id) });
        if (user.verified) {
            throw new ErrorObject({
                message: 'Email already verified',
                statusCode: 400
            });
        }
        await usersCollection.updateOne({ _id: ObjectId(user_id) }, { $set: { verified: true } });
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
    updatePassword,
    getUserByEmail,
    getUserById,
    createRefreshToken,
    setRefreshToken,
    getRefreshToken,
    deleteRefreshToken,
    deleteRefreshTokens,
    verifyUser
}