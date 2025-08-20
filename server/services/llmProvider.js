const KnowledgeBase = require("../models/KnowledgeBase");

const classify = async (text) => {
  let category = "other";
  let confidence = 0.5;

  if (/refund|invoice/i.test(text)) {
    category = "billing"; confidence = 0.9;
  } else if (/error|bug|stack/i.test(text)) {
    category = "tech"; confidence = 0.9;
  } else if (/delivery|shipment/i.test(text)) {
    category = "shipping"; confidence = 0.9;
  }

  return { predictedCategory: category, confidence };
};

const draftReply = async (text, articles) => {
  const citations = articles.map(a => a._id.toString());
  let draftReply = `Hello,\n\nHere’s a suggested answer:\n${text}\n\nReferences:\n`;
  articles.forEach((a, i) => {
    draftReply += `${i + 1}. ${a.title}\n`;
  });
  return { draftReply, citations };
};

module.exports = { classify, draftReply };
