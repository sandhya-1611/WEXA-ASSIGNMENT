const express = require("express");
const router = express.Router();
const Config = require("../models/Config");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// GET config (admin only)
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const config = await Config.findOne();
    if (!config) {
      return res.status(404).json({ error: "Config not found" });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update config
router.put("/", auth, adminOnly, async (req, res) => {
  try {
    const { autoCloseEnabled, confidenceThreshold, slaHours } = req.body;
    let config = await Config.findOne();
    if (!config) {
      config = new Config({ autoCloseEnabled, confidenceThreshold, slaHours });
    } else {
      config.autoCloseEnabled = autoCloseEnabled ?? config.autoCloseEnabled;
      config.confidenceThreshold = confidenceThreshold ?? config.confidenceThreshold;
      config.slaHours = slaHours ?? config.slaHours;
    }
    await config.save();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
