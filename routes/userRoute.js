const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.route("/Homepage").post(authController.userSignUp);
router.route("/login").post(authController.userLogin);

module.exports = router;
