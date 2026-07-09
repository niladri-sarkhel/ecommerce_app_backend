import joi from "joi";

const envSchema = joi.object({
  NODE_ENV: joi.string().valid("development", "test", "production").required(),

  PORT: joi.number().integer().port().required(),

  APP_NAME: joi.string().required(),

  APP_URL: joi.string().uri().required(),

  MONGODB_URL: joi.string().uri().required(),

  JWT_SECRET: joi.string().required(),

  LOG_LEVEL: joi
    .string()
    .valid("fatal", "error", "warn", "info", "debug", "trace")
    .required(),
});

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true,
});

if (error) {
  const errors = error.details.map((detail) => detail.message);

  console.error({
    message: "❌ Failed to start server due to invalid environment variables",
    errors,
  });

  process.exit(1);
}

export const env = Object.freeze(value);
