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
const Ticket = require("../models/Ticket");
const authMiddleware = require("../middleware/authMiddleware");
const axios = require("axios"); 

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const ticket = new Ticket({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || "other",
      createdBy: req.user.id
    });

    await ticket.save();

    try {
      await axios.post(`http://localhost:${process.env.PORT}/api/agent/triage`, {
        ticketId: ticket._id
      });
    } catch (err) {
      console.error("Failed to trigger agent triage:", err.message);
    }

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
