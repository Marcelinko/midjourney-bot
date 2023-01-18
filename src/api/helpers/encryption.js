const bcrypt = require('bcrypt');

const encryptPassword = async (password) => {
    return await bcrypt.hash(password, 8);
}
const validatePassword = async (password, hashedPassword) =>{
    return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
    encryptPassword,
    validatePassword
}