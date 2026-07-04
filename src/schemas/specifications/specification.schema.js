import mongoose from "mongoose";
import {
  networkSchema,
  bodySchema,
  displaySchema,
  platformSchema,
  memorySchema,
  cameraSchema,
  audioSchema,
  connectivitySchema,
  batterySchema,
  sensorSchema,
} from "./index.js";

export const specificationsSchema = new mongoose.Schema(
  {
    network: networkSchema,
    body: bodySchema,
    display: displaySchema,
    platform: platformSchema,
    memory: memorySchema,
    camera: cameraSchema,
    audio: audioSchema,
    connectivity: connectivitySchema,
    battery: batterySchema,
    sensors: [sensorSchema],
  },
  {
    _id: false,
  },
);
