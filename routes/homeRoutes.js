const express = require("express");
const router = express.Router();
const helper = require("../utils/helper");
const shortUrlController = require("../controllers/shortUrlController");

// Home page
router.get("/", (req, res) => {
  res.render("newHome");
});

// Login and register pages
router.get("/login", (req, res) => {
  res.render("Login");
});

router.get("/register", (req, res) => {
  res.render("Register");
});

// Analytics page
router.get("/my-urls",shortUrlController.analyticsHandler, (req, res) => {
    
  res.render("Analytics");
});

// Home page after login
router.get("/Users/login", async(req, res) => {
  const userId = req.user && req.user._id;
  if (!userId) {
    return res.redirect("/login");
  }
  const page = parseInt(req.query.page) || 1;

  // Set the number of records to display per page
  const limit = 5;
  const shortURLs = await helper.getShortURLsForUser(userId, page, limit);

 // Pass the shortURLs, page, and limit variables to the template
 res.render("Home", { shortURLs, page, limit });
});

//redirect to long url
router.get("/Users/:shortURLId", shortUrlController.updateShortURLVisits,
);
module.exports = router;
