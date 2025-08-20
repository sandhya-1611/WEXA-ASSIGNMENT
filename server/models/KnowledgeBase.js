const mongoose = require("mongoose");

const kbSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model("KnowledgeBase", kbSchema);
