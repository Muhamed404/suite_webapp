const express = require("express");
const router = express.Router();

const {verifyOTP} = require('../../controllers/mfa/verify-mfa')
const {renderCreateForm} = require('../../controllers/mfa/create-mfa-smtp')
const {createSMTP} = require('../../controllers/mfa/save-mfa-smtp')


router.get("/settings", renderCreateForm);
router.post("/create", createSMTP);

router.get('/', (req, res) => {
    if (!req.session.mfaPendingUser) {
        return res.redirect('/phm/login'); // Block direct access
    }
    // res.render('mfa', { email: req.session.mfaPendingUser.email }); // Send email to view if needed
    res.render('pages/mfa/mfa-login'); // Send email to view if needed
});


router.post('/', verifyOTP);

module.exports = router;
