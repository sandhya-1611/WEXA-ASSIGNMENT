const express = require("express");
const KnowledgeBase = require("../models/KnowledgeBase");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/", authMiddleware, async (req, res) => {
  try {
    const kb = new KnowledgeBase({
      question: req.body.question,
      answer: req.body.answer,
      createdBy: req.user.id
    });

    await kb.save();
    res.status(201).json(kb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const kbList = await KnowledgeBase.find().sort({ createdAt: -1 });
    res.json(kbList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await KnowledgeBase.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Article not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await KnowledgeBase.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    if (!deleted) return res.status(404).json({ message: "Article not found" });
    res.json({ message: "Article deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
