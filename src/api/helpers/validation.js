const Joi = require('joi');

const registerSchema = Joi.object({
  display_name: Joi.string().min(5).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required()
});

const refreshTokenSchema = Joi.object({
  user_id: Joi.string().required(),
  refresh_token: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema
}