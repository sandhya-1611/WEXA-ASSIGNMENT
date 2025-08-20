const express = require("express");
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const ticket = new Ticket({
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority || "medium",
      user: req.user.id
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Ticket.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Ticket not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Ticket.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!deleted) return res.status(404).json({ message: "Ticket not found" });
    res.json({ message: "Ticket deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
