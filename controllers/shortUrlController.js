const ShortURL = require("../model/shortUrlModel");
const User = require("../model/userModel");
const helper = require("../utils/helper");
const fs = require("fs");
const Analytics = require("../model/AnalyticsModel");
const QRCode = require("../model/qrCodeModel");
const qrcode = require("qrcode");
const RedisClient = require("../config/redisClient");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// Function to generate a QR code
const generateQRCode = async (text) => {
  const cacheKey = `qrcode:${text}`;
  const cachedQrcode = await RedisClient.get(cacheKey);
  if (cachedQrcode) {
    console.log("cache");
    return cachedQrcode;
  }

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

// Function to generate a QR code
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

// Function to generate a short URL
const generateShortURL = catchAsync(async (req, res, next) => {
  const { longURL, customURL } = req.body;
  const userId = req.user._id;

  // Get the current page number from the query string, default to 1
  const page = parseInt(req.query.page) || 1;

  // Set the number of records to display per page
  const limit = 5;

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

    await helper.associateShortURLWithUser(userId, newShortURL);
    const shortURLs = await helper.getShortURLsForUser(userId);

    // Paginate the short URLs
    const paginatedURLs = shortURLs.slice((page - 1) * limit, page * limit);

    return res.render("Home", { shortURLs: paginatedURLs, page });
  } catch (error) {
    const userId = req.user._id;
    const shortURLs = await helper.getShortURLsForUser(userId);
    const paginatedURLs = shortURLs.slice((page - 1) * limit, page * limit);

    return res.render("Home", {
      shortURLs: paginatedURLs,
      page,
      error: error.message,
    });
  }
});

// Function to update the visits variable of a ShortURL document
const updateShortURLVisits = async (req, res) => {
  const shortURL = req.params.shortURLId;
  const userId = req.user && req.user._id;

  try {
    // Find the ShortURL document with the provided short URL
    const url = await ShortURL.findOne({ shortURL });

    if (!url) {
      return res.status(404).send("Short URL not found");
    }

    // Update the visits variable by incrementing its value
    url.visits += 1;

    // Get the IP address from the request
    // const ipAddress = req.ip;
    const ipAddress = "197.210.44.98";

    // Get the user agent from the request
    const userAgent = req.headers["user-agent"];

    // Get the location information for the IP address
    const location = await helper.getLocationByIp(ipAddress);

    // Create a new Analytics document
    const analytics = new Analytics({
      shortURL: url._id,
      userAgent,
      ipAddress,
      location,
    });
    // console.log(analytics);

    // Save the analytics data
    await analytics.save();

    // Find the user who generated the ShortURL
    const user = await User.findById(userId);

    if (user) {
      // Associate the analytics with the user
      user.analytics.push(analytics._id);

      // Save the updated user document
      await user.save();
    }

    // Save the updated ShortURL document
    await url.save();

    // Redirect the user to the long URL
    res.redirect(url.longURL);
  } catch (error) {
    console.error("Error updating visits:", error);
    return res.status(500).send("Internal Server Error");
  }
};

// Function to get analytics data for the user's short URLs
const analyticsHandler = async (req, res) => {
  const userId = req.user && req.user._id;
  if (!userId) {
    // Handle the case where there is no userId
    return res.render("Analytics", { isLoggedIn: false });
  }
  // Get the current page number from the query string, default to 1
  const page = parseInt(req.query.page) || 1;

  // Set the number of records to display per page
  const limit = 10;
  try {
    // Find the user by userId and populate the shortURLs field
    const user = await User.findById(userId).populate("shortURLs");

    // Extract the shortURLs from the user object
    const urls = user.shortURLs;

    // Perform the $lookup aggregation to get analytics data for each shortURL
    const analytics = await Analytics.aggregate([
      {
        $match: { shortURL: { $in: urls.map((url) => url._id) } },
      },
      {
        $lookup: {
          from: "shorturls",
          localField: "shortURL",
          foreignField: "_id",
          as: "shortURL",
        },
      },
      {
        $unwind: "$shortURL",
      },
      {
        $project: {
          "shortURL.shortURL": 1,
          "shortURL.longURL": 1,
          "shortURL.visits": 1, // Access the visits from the urls array
          userAgent: 1,
          ipAddress: 1,
          location: 1,
          timestamp: 1,
        },
      },
      {
        $skip: (page - 1) * limit, // skip records for previous pages
      },
      {
        $limit: limit, // limit the number of records returned
      },
    ]);
    // console.log(analytics, "analytics");
    return res.render("Analytics", {
      isLoggedIn: true,
      analytics,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error getting analytics:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  analyticsHandler,
  generateQRCodeHandler,
  updateShortURLVisits,
  generateShortURL,
};
