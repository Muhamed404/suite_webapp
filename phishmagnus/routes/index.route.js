// routes/index.js

const express = require("express");
const router = express.Router();
const controller = require('../controllers/phm_dashboard_controller')

router.get("/index/:ISGlobalDashboard?", controller.dashboard);
// router.get('/:ISGlobalDashboard?',controller.home)
module.exports = router;
