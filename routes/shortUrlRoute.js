const express = require("express");
const router = express.Router();
const shortUrlController = require("../controllers/shortUrlController");


router.route("/shorts").post(shortUrlController.generateShortURL);
router.route("/generateQrCode").post(shortUrlController.generateQRCodeHandler);
router.route("/:shortURLId").get(shortUrlController.updateShortURLVisits);



module.exports = router;
