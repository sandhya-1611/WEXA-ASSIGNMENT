const AuditLog = require("../models/AuditLog");

await AuditLog.create({
  ticketId: ticket._id,
  traceId,
  actor: "system",
  action: "AGENT_CLASSIFIED",
  meta: { predictedCategory, confidence },
  timestamp: new Date()
});

await AuditLog.create({
  ticketId: ticket._id,
  traceId,
  actor: "system",
  action: "KB_RETRIEVED",
  meta: { articleIds: citations },
  timestamp: new Date()
});

await AuditLog.create({
  ticketId: ticket._id,
  traceId,
  actor: "system",
  action: "DRAFT_GENERATED",
  meta: { draftReply },
  timestamp: new Date()
});

await AuditLog.create({
  ticketId: ticket._id,
  traceId,
  actor: "system",
  action: autoClosed ? "AUTO_CLOSED" : "ASSIGNED_TO_HUMAN",
  meta: { confidence, autoClosed },
  timestamp: new Date()
});
