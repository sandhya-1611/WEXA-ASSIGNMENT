const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const Ticket = require("../models/Ticket");
const AgentSuggestion = require("../models/AgentSuggestion");
const KnowledgeBase = require("../models/KnowledgeBase");
const Config = require("../models/Config");
const AuditLog = require("../models/AuditLog");

// POST /api/agent/triage
router.post("/triage", async (req, res) => {
  try {
    const { ticketId } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const traceId = uuidv4();
    const text = ticket.title + " " + ticket.description;

    // 1️⃣ Classify ticket
    let predictedCategory = "other";
    let confidence = 0.5;

    if (/refund|invoice/i.test(text)) {
      predictedCategory = "billing";
      confidence = 0.9;
    } else if (/error|bug|stack/i.test(text)) {
      predictedCategory = "tech";
      confidence = 0.85;
    } else if (/delivery|shipment/i.test(text)) {
      predictedCategory = "shipping";
      confidence = 0.8;
    }

    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: "system",
      action: "AGENT_CLASSIFIED",
      meta: { predictedCategory, confidence },
      timestamp: new Date()
    });

    // 2️⃣ Retrieve top KB articles
    const kbArticles = await KnowledgeBase.find(
      { $text: { $search: text }, status: "published" },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(3);

    const citations = kbArticles.map((a) => a._id);

    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: "system",
      action: "KB_RETRIEVED",
      meta: { articleIds: citations },
      timestamp: new Date()
    });

    // 3️⃣ Draft reply
    const draftReply = `Hi, based on our KB: \n${kbArticles
      .map((a, i) => `${i + 1}. ${a.question}`)
      .join("\n")}`;

    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: "system",
      action: "DRAFT_GENERATED",
      meta: { draftReply },
      timestamp: new Date()
    });

    // 4️⃣ Decision: auto-close or assign to human
    const config = await Config.findOne({});
    let autoClosed = false;

    if (config?.autoCloseEnabled && confidence >= config.confidenceThreshold) {
      ticket.status = "resolved";
      ticket.updatedAt = new Date();
      await ticket.save();
      autoClosed = true;
    } else {
      ticket.status = "waiting_human";
      await ticket.save();
    }

    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: "system",
      action: autoClosed ? "AUTO_CLOSED" : "ASSIGNED_TO_HUMAN",
      meta: { confidence, autoClosed },
      timestamp: new Date()
    });

    // 5️⃣ Save AgentSuggestion
    const suggestion = await AgentSuggestion.create({
      ticketId: ticket._id,
      predictedCategory,
      articleIds: citations,
      draftReply,
      confidence,
      autoClosed,
      modelInfo: {
        provider: "STUB",
        model: "heuristic-v1",
        promptVersion: "1.0",
        latencyMs: 0
      },
      createdAt: new Date()
    });

    res.json({ ticket, suggestion, traceId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/suggestions/:ticketId", async (req, res) => {
  try {
    const suggestions = await AgentSuggestion.find({ ticketId: req.params.ticketId });
    if (!suggestions || suggestions.length === 0) {
      return res.status(404).json({ error: "No suggestions found for this ticket" });
    }
    res.json(suggestions);
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
