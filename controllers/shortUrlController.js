const ShortURL = require("../model/shortUrlModal");
const User = require("../model/userModel");
const helper = require("../utils/helper");
const fs = require("fs");

const QRCode = require("../model/qrCode");
const qrcode = require("qrcode");
const RedisClient = require("../config/redisClient");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const generateQRCode = async (text) => {
  const cacheKey = `qrcode:${text}`;
  const cachedQrcode = await RedisClient.get(cacheKey);
  if (cachedQrcode) {
    console.log("cache");
    return cachedQrcode;
  }
  console.log(text);
  return new Promise((resolve, reject) => {
    if (!text) {
      const error = new Error("Invalid input: text is empty or null");
      reject(error);
      return;
    }

    // Generate QR code as an image file
    const filePath = `public/img/qrcode_${Date.now()}.png`; // File path to save the image
    qrcode.toFile(filePath, text, (error) => {
      if (error) {
        reject(error);
        return;
      }

      // Read the image file as binary data
      fs.readFile(filePath, (error, qrCodeData) => {
        if (error) {
          reject(error);
          return;
        }

        // Remove the temporary image file
        fs.unlink(filePath, (error) => {
          if (error) {
            console.error("Error deleting temporary QR code image:", error);
          }
        });

        // Convert the binary data to base64 string
        const qrCodeBase64 = qrCodeData.toString("base64");
        const qrCodeDataUrl = "data:image/png;base64," + qrCodeBase64;

        RedisClient.set(cacheKey, qrCodeDataUrl);

        resolve(qrCodeDataUrl);
      });
    });
  });
};

const generateQRCodeHandler = catchAsync(async (req, res, next) => {
  const text = req.body.text; // Access the input text from the request body or query parameters

  if (!text) {
    return next(new AppError("Invalid input: text is empty or null", 400));
  }

  const qrCodeDataUrl = await generateQRCode(text);

  // QR code generated successfully
  console.log("QR code generated:", qrCodeDataUrl);

  // Associate the QR code with the user who generated it
  const userId = req.user ? req.user._id : null;
  const qrCode = new QRCode({
    user: userId,
    data: qrCodeDataUrl,
  });

  const savedQRCode = await qrCode.save();

  // Update the user's QR codes array with the new QR code
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $push: { qrCodes: savedQRCode._id } },
    { new: true }
  );

  res.send(qrCodeDataUrl); // Send the updated user object as the response
});
// Function to generate a new ShortURL document
const generateShortURL = catchAsync(async (req, res, next) => {
  const { longURL, customURL } = req.body;
  const userId = req.user._id;

  try {
    // Check if the custom URL or long URL already exists in the database
    const existingURL = await ShortURL.findOne({
      $or: [{ customURL }, { longURL }],
    });

    if (existingURL) {
      if (existingURL.customURL === customURL) {
        throw new Error("Custom URL already exists");
      } else if (existingURL.longURL === longURL) {
        throw new Error("Short URL already generated for this long URL");
      }
    }

    // Create a new ShortURL document
    const newShortURL = new ShortURL({
      longURL,
      customURL: customURL || undefined,
    });

    // Save the document to the database
    await newShortURL.save();

    const user = await helper.associateShortURLWithUser(userId, newShortURL);
    const shortURLs = await helper.getShortURLsForUser(userId);

    // Limit the shortURLs to the last 3 URLs
    const lastThreeURLs = shortURLs.slice(-3);

    return res.render("Home", { shortURLs: lastThreeURLs });
  } catch (error) {
    const userId = req.user._id;
    const shortURLs = await helper.getShortURLsForUser(userId);
    const lastThreeURLs = shortURLs.slice(-3);

    return res.render("Home", { shortURLs: lastThreeURLs, error: error.message });
  }
});



const updateShortURLVisits = async (req, res) => {
  const shortURL = req.params.shortUrl;

  try {
    // Find the ShortURL document with the provided short URL
    const url = await ShortURL.findOne({ shortURL });

    if (!url) {
      return res.status(404).send("Short URL not found");
    }

    // Update the visits variable by incrementing its value
    url.visits += 1;

    // Save the updated ShortURL document
    await url.save();

    // Redirect the user to the long URL
    return res.redirect(url.longURL);
  } catch (error) {
    console.error("Error updating visits:", error);
    return res.status(500).send("Internal Server Error");
  }
};
module.exports = {
  generateQRCodeHandler,
  updateShortURLVisits,
  generateShortURL,
};
