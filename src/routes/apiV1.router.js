import express from "express";

import { catalogRouter } from "./catalog.router.js";
import { sellerRouter } from "./seller.router.js";
import { userRouter } from "./user.router.js";
import { testRouter } from "./test-router.js";

console.log("this is the apiV1Router");

export const apiV1Router = express.Router();
apiV1Router.use("/catalog", catalogRouter);
apiV1Router.use("/sellers", sellerRouter);
apiV1Router.use("/users", userRouter);
apiV1Router.use("/test", testRouter);
