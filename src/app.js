import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"; // 👈 Import here

import { handleReqErrors } from "#errors";
import { apiV1Router, testRouter } from "#routes";

export const app = express();
app
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(cookieParser())
  .use(cors())
  .use("/api/v1", apiV1Router)
  .use("/test", testRouter)
  .use((_, res) => {
    return res.status(404).json({ message: "page not found :(" });
  })
  .use(handleReqErrors);
