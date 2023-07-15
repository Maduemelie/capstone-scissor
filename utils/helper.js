const User = require("../model/userModel");
const ShortURL = require("../model/shortUrlModel");
const WebServiceClient = require("@maxmind/geoip2-node").WebServiceClient;

const getShortURLsForUser = async (userId) => {
  const user = await User.findById(userId);
  const shortURLs = await ShortURL.find({ _id: { $in: user.shortURLs } });
  return shortURLs;
};

const associateShortURLWithUser = async (userId, shortURL) => {
  // Find the user who generated the ShortURL
  const user = await User.findById(userId);

  // Associate the ShortURL with the user
  user.shortURLs.push(shortURL);
  await user.save();
};
// Get the MaxMind license key and user ID from the environment variables
const MAXMIND_LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY;
const MAXMIND_USER_ID = process.env.MAXMIND_USER_ID;

// Get the location of the user based on their IP address
const getLocationByIp = async (ipAddress) => {
  try {
    const client = new WebServiceClient(MAXMIND_USER_ID, MAXMIND_LICENSE_KEY, {
      host: "geolite.info",
    });
    const countryResponse = await client.country(ipAddress);
    const cityResponse = await client.city(ipAddress);

    const location = {
      country: countryResponse.country.names ? countryResponse.country.names.en || countryResponse.country.names.default : '',
      city: cityResponse.city && cityResponse.city.names ? cityResponse.city.names.en || cityResponse.city.names.default : '',
    };
    return location;
  } catch (error) {
    console.error("Error retrieving location:", error);
    throw error;
  }
};


// const shortUrlAnalytics = async (shortURLId, userId) => {
//   try {
//     // Find the ShortURL document with the provided short URL
//     const url = await ShortURL.findOne({ shortURL: shortURLId });
//     if (!url) {
//       throw new Error("Short URL not found");
//     }
//     // Get the QR codes for the user
//     const qrCodes = await QRCode.find({ user: userId });
//     // Get all the analytics data for the short URL
//     const analytics = await Analytics.find({ shortURL: url._id });

//     return { analytics, qrCodes };
//   } catch (error) {
//     console.error("Error getting analytics:", error);
//     throw error;
//   }
// };


module.exports = {
  getShortURLsForUser,
  associateShortURLWithUser,
  getLocationByIp,
  // shortUrlAnalytics,
};
