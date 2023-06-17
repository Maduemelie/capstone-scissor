const express = require("express");
const router = express.Router();
const shortUrlController = require("../controllers/shortUrlController");


router.route("/shorts").post(shortUrlController.generateShortURLAndUpdateHomepage);
router.route("/generateQrCode").post(shortUrlController.generateQRCodeHandler);



module.exports = router;
