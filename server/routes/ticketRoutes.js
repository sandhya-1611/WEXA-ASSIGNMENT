// const express = require("express");
// const Ticket = require("../models/Ticket");
// const authMiddleware = require("../middleware/authMiddleware");

// const router = express.Router();

// router.post("/", authMiddleware, async (req, res) => {
//   try {
//     const ticket = new Ticket({
//       title: req.body.title,
//       description: req.body.description,
//       category: req.body.category || "other",
//       createdBy: req.user.id,
//     });

//     await ticket.save();
//     res.status(201).json(ticket);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.get("/", authMiddleware, async (req, res) => {
//   try {
//     let tickets;
//     if (req.user.role === "user") {
//       tickets = await Ticket.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
//     } else {
//       tickets = await Ticket.find().sort({ createdAt: -1 });
//     }
//     res.json(tickets);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// router.get("/:id", authMiddleware, async (req, res) => {
//   try {
//     const ticket = await Ticket.findById(req.params.id);
//     if (!ticket) return res.status(404).json({ message: "Ticket not found" });

//     if (req.user.role === "user" && ticket.createdBy.toString() !== req.user.id) {
//       return res.status(403).json({ message: "Access denied" });
//     }
//     res.json(ticket);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const AuditLog = require("../models/AuditLog");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new ticket
router.post("/", authMiddleware, async (req, res) => {
  try {
    // Ensure user info is attached from authMiddleware
    const userId = req.user.id;

    // Create ticket with createdBy
    const ticket = new Ticket({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || "other",
      status: "open",
      createdBy: userId,      // <-- important
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await ticket.save();

    // Audit log for ticket creation
    const traceId = uuidv4();
    await AuditLog.create({
      ticketId: ticket._id,
      traceId,
      actor: "user",
      action: "TICKET_CREATED",
      meta: { title: ticket.title },
      timestamp: new Date(),
    });

    // Trigger agent triage asynchronously
    axios
      .post("http://localhost:5000/api/agent/triage", {
        ticketId: ticket._id,
      })
      .catch((err) => console.error("Triage failed:", err.message));

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get all tickets for the logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await Ticket.find({ createdBy: userId }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ticket by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    // Optional: restrict access to owner or agents
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
