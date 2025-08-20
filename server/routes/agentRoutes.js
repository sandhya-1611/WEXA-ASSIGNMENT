const express = require("express");
const Ticket = require("../models/Ticket");
const AgentSuggestion = require("../models/AgentSuggestion");
const KnowledgeBase = require("../models/KnowledgeBase");
const { classify, draftReply } = require("../services/llmProvider");

const router = express.Router();

router.post("/triage", async (req, res) => {
  const { ticketId } = req.body;
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const classification = await classify(ticket.description);

    const kbArticles = await KnowledgeBase.find({
      $text: { $search: ticket.description }
    }).limit(3);

    const draft = await draftReply(ticket.description, kbArticles);

    const agentSuggestion = new AgentSuggestion({
      ticketId: ticket._id,
      predictedCategory: classification.predictedCategory,
      articleIds: kbArticles.map(a => a._id),
      draftReply: draft.draftReply,
      confidence: classification.confidence,
      modelInfo: { provider: "STUB", model: "v1", promptVersion: "v1", latencyMs: 10 },
      autoClosed: false
    });

    await agentSuggestion.save();

    res.json(agentSuggestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
