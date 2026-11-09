import express from "express";

import { CatalogController, testController } from "#controllers";

const catalogController = new CatalogController();

export const testRouter = express.Router();

testRouter
  .get("/ping", testController.ping)
  .post("/echo", testController.echo)
  .get("/async", testController.asyncTest)
  .get("/test-db-catalog", testController.testDbCatalog)
  .get("/catalog/search", catalogController.getLiveSuggestions)
  .get("/send-mail", testController.sendEmail);
