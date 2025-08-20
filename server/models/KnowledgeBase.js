const mongoose = require("mongoose");

const knowledgeBaseSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("KnowledgeBase", knowledgeBaseSchema);
