import express from "express";

import { CatalogController } from "#controllers";

console.log("this is the apiV1Router");

export const apiV1Router = express.Router();
// apiV1Router.get("/catalog/search", CatalogController.getLiveSuggestions);
