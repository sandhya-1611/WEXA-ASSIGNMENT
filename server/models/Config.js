const mongoose = require("mongoose");

const configSchema = new mongoose.Schema({
  autoCloseEnabled: { type: Boolean, default: true },
  confidenceThreshold: { type: Number, default: 0.8 },
  slaHours: { type: Number, default: 24 }
}, { timestamps: true });

module.exports = mongoose.model("Config", configSchema);