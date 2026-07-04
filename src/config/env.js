import joi from "joi";

console.log({
  APP_NAME: process.env.APP_NAME,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  APP_URL: process.env.APP_URL,
  MONGODB_URL: process.env.MONGODB_URL,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

const envSchema = joi.object({
  NODE_ENV: joi.string().valid("development", "test", "production").required(),

  PORT: joi.number().integer().port().required(),

  APP_NAME: joi.string().required(),

  APP_URL: joi.string().uri().required(),

  MONGODB_URL: joi.string().uri().required(),

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
console.log(env);
