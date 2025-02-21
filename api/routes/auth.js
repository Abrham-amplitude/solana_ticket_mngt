var express = require("express");
var router = express.Router();
const auth = require("../auth");

// Auth Endpoints
router.post('/login', auth.login);
router.post('/signup', auth.signup);
router.post('/logout', auth.logout);

module.exports = router;