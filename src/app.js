import express from "express";

import cors from "cors"; // 👈 Import here

// import { handleReqErrors } from "#errors";
import { testRouter, apiV1Router } from "#routes";

export const app = express();
app
  .use(express.json())
  .use(cors())
  .use(express.urlencoded({ extended: true }))
  .use("/test", testRouter)
  .use("/api/v1", apiV1Router)
  .use((_, res) => {
    return res.status(404).json({ message: "page not found :(" });
  });
// .use(handleReqErrors);
