import express from "express";

import { catalogRouter } from "./catalog.router.js";

console.log("this is the apiV1Router");

export const apiV1Router = express.Router();
apiV1Router.use("/catalog", catalogRouter);
