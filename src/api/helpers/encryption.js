const bcrypt = require('bcrypt');
const ErrorObject = require('../helpers/error');

const encryptPassword = async (password) => {
    try{
        return await bcrypt.hash(password, 8);
    }
    catch(err){
        throw new ErrorObject({
            message: 'Error while encrypting password',
            statusCode: 500
        });
    }
}
const validatePassword = async (password, hashedPassword) =>{
    try{
        return await bcrypt.compare(password, hashedPassword);
    }
    catch(err){
        throw new ErrorObject({
            message: 'Error while validating password',
            statusCode: 500
        });
    }
}

module.exports = {
    encryptPassword,
    validatePassword
}