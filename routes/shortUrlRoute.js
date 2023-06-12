const express = require("express");
const router = express.Router();
const shortUrlController = require("../controllers/shortUrlController");


router.route("/shorts").post(shortUrlController.generateShortURL);



module.exports = router;
