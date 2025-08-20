const mongoose = require("mongoose");

const KnowledgeBaseSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    tags: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

KnowledgeBaseSchema.index({ question: 'text', answer: 'text', tags: 'text' });

module.exports = mongoose.model("KnowledgeBase", KnowledgeBaseSchema);
