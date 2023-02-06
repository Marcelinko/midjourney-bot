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

const newPasswordSchema = Joi.object({
  password: Joi.string().min(8).required(),
  password_confirm: Joi.string().valid(Joi.ref('password')).required()
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required()
});

const emailSchema = Joi.object({
  email: Joi.string().email().lowercase().required()
})

const promptSchema = Joi.object({
  prompt: Joi.string().regex(/^[a-zA-Z0-9\s,]+$/).min(3).max(300).replace(/[\s,]/g, '').required()
});

module.exports = {
  registerSchema,
  loginSchema,
  newPasswordSchema,
  refreshTokenSchema,
  emailSchema,
  promptSchema,
}