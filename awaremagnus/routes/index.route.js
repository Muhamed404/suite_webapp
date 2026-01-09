// routes/index.js

const express = require("express");
const router = express.Router();
const controller = require('../controllers/awm_dashboard_controller')

router.get("/", controller.dashboard);
// router.get('/:ISGlobalDashboard?',controller.home)
module.exports = router;
