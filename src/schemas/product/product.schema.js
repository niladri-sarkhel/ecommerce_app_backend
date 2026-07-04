import mongoose from "mongoose";

import {
  identitySchema,
  catalogSchema,
  mediaSchema,
  metadataSchema,
} from "./index.js";

import { specificationsSchema } from "../specifications/specification.schema.js";

export const productSchema = new mongoose.Schema(
  {
    identity: identitySchema,
    catalog: catalogSchema,
    specifications: specificationsSchema,
    media: mediaSchema,
    metadata: metadataSchema,
  },
  {
    timestamps: true,
  },
);
