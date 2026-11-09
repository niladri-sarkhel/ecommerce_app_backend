import joi from "joi";

const envSchema = joi.object({
  NODE_ENV: joi.string().valid("development", "test", "production").required(),

  PORT: joi.number().integer().port().required(),

  APP_NAME: joi.string().required(),

  APP_URL: joi.string().uri().required(),

  MONGODB_URL: joi.string().uri().required(),

  JWT_SECRET: joi.string().required(),

  SMTP_HOST: joi.string().required(),

  SMTP_PORT: joi.number().integer().port().required(),

  SMTP_SECURE: joi.boolean().required(),

  SMTP_USER: joi.string().required(),

  SMTP_PASS: joi.string().required(),

  SMTP_FROM: joi.string().required(),

  LOG_LEVEL: joi
    .string()
    .valid("fatal", "error", "warn", "info", "debug", "trace")
    .required(),

  REDIS_HOST: joi.string().required(),

  REDIS_PORT: joi.number().integer().port().required(),

  REDIS_PASSWORD: joi.string().required(),
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

console.log("env variables loaded successfully");
console.log(env);
