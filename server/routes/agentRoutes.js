const Config = require("../models/Config");
const Ticket = require("../models/Ticket");
const AgentSuggestion = require("../models/AgentSuggestion");
const KnowledgeBase = require("../models/KnowledgeBase");
const { v4: uuidv4 } = require("uuid");

router.post("/triage", async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const traceId = uuidv4();

    let predictedCategory = "other";
    let confidence = 0.5;

    const text = ticket.title + " " + ticket.description;
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

    const kbArticles = await KnowledgeBase.find(
      { $text: { $search: text }, status: "published" },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(3);

    const citations = kbArticles.map((a) => a._id);

    const draftReply = `Hi, based on our KB: \n${kbArticles
      .map((a, i) => `${i + 1}. ${a.question}`)
      .join("\n")}`;

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
