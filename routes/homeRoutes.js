const express = require("express");
const router = express.Router();
const helper = require("../utils/helper");
const shortUrlController = require("../controllers/shortUrlController");
router.get("/", (req, res) => {
  res.render("newHome");
});

router.get("/login", (req, res) => {
  res.render("Login");
});

router.get("/register", (req, res) => {
  res.render("Register");
});

router.get("/my-urls",shortUrlController.analyticsHandler, (req, res) => {
    
  res.render("Analytics");
});

module.exports = router;
