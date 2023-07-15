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

    await helper.associateShortURLWithUser(userId, newShortURL);
    const shortURLs = await helper.getShortURLsForUser(userId);

    // Limit the shortURLs to the last 3 URLs
    const lastThreeURLs = shortURLs.slice(-3);

    return res.render("Home", { shortURLs: lastThreeURLs });
  } catch (error) {
    const userId = req.user._id;
    const shortURLs = await helper.getShortURLsForUser(userId);
    const lastThreeURLs = shortURLs.slice(-3);

    return res.render("Home", {
      shortURLs: lastThreeURLs,
      error: error.message,
    });
  }
});

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
    console.log(analytics);

    // Save the analytics data
    await analytics.save();
    const user = await User.findById(userId);

    if (user) {
      // Associate the analytics with the user
      user.analytics.push(analytics._id);

      // Save the updated user document
      await user.save();
    }
    // Associate the analytics with the user
 
    // Save the updated ShortURL document
    await url.save();

    // Redirect the user to the long URL
    res.redirect(url.longURL);
    // console.log(url.longURL);
    // console.log("redirected");
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
          userAgent: 1,
          ipAddress: 1,
          location: 1,
          timestamp: 1,
        },
      },
    ]);
    console.log(analytics, "analytics");
    return res.render("Analytics", { isLoggedIn: true, analytics });
  } catch (error) {
    console.error("Error getting analytics:", error);
    return res.status(500).send("Internal Server Error");
  }
};

// const analyticsHandler = async (req, res) => {
//   const userId = req.user && req.user._id;
//   console.log(userId);
//   if (!userId) {
//     // Handle the case where there is no userId
//     return res.render("Analytics", { isLoggedIn: false });
//   }
//   try {
//     // Find all the ShortURL documents created by the user

//     const user = await User.findById(userId).populate("shortURLs");
//     const urls = user.shortURLs;
//     console.log(urls, "urls");
//     const urlData = await Promise.all(
//       urls.map(async (url) => {
//         const analytics = await Analytics.find({ shortURL: url._id }); // Use url._id instead of url.shortURL
//         const extractedData = analytics.map((analytic) => ({
//           shortURL: url.shortURL, // Access the shortURL from the urls array
//           longURL: url.longURL, // Access the longURL from the urls array
//           visits: url.visits, // Access the visits from the urls array
//           timestamp: analytic.timestamp,
//           userAgent: analytic.userAgent,
//           ipAddress: analytic.ipAddress,
//           location: analytic.location,
//         }));

//         console.log(extractedData , "extractedData");
//         return extractedData;
//       })
//     );

//     console.log(urlData, "urlData");

//     // console.log(url);

//     // Get all the analytics data for the short URLs
//     const analytics = await Analytics.aggregate([
//       {
//         $match: { shortURL: { $in: urls.map((url) => url._id) } },
//       },
//       {
//         $lookup: {
//           from: "shorturls",
//           localField: "shortURL",
//           foreignField: "_id",
//           as: "shortURL",
//         },
//       },
//       {
//         $unwind: "$shortURL",
//       },
//       {
//         $lookup: {
//           from: "analytics",
//           localField: "shortURL._id",
//           foreignField: "shortURL",
//           as: "visits",
//         },
//       },
//       {
//         $addFields: {
//           visits: { $size: "$visits" },
//         },
//       },
//       {
//         $project: {
//           "shortURL.shortURL": 1,
//           "shortURL.longURL": 1,
//           visits: 1,
//           userAgent: 1,
//           ipAddress: 1,
//           location: 1,
//           timestamp: 1,
//         },
//       },
//     ]);
//     console.log(analytics);
//     return res.render("Analytics", { isLoggedIn: true, analytics: urlData });
//   } catch (error) {
//     console.error("Error getting analytics:", error);
//     return res.status(500).send("Internal Server Error");
//   }
// };

module.exports = {
  analyticsHandler,
  generateQRCodeHandler,
  updateShortURLVisits,
  generateShortURL,
};
