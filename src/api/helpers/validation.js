const Joi = require('joi');

const authSchema = Joi.object({
  displayName: Joi.string().min(5).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
})

module.exports = {
    authSchema
}