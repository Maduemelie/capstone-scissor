
// Import the models
const User = require("../model/userModel");
const ShortURL = require("../model/shortUrlModel");
// Import the MaxMind WebServiceClient
const WebServiceClient = require("@maxmind/geoip2-node").WebServiceClient;


// Get the short URLs for a user

const getShortURLsForUser = async (userId, page = 1, limit = 5) => {
  // Find the user by userId and populate the shortURLs field
  const user = await User.findById(userId).populate({
    path: "shortURLs",
    options: {
      skip: (page - 1) * limit,
      limit,
    },
  });
    if (!user || user.shortURLs.length === 0) {
      return [];
    }

  return user.shortURLs;
};

// const getShortURLsForUser = async (userId) => {
//   const user = await User.findById(userId);
//   const shortURLs = await ShortURL.find({ _id: { $in: user.shortURLs } });
//   return shortURLs;
// };

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
     // Check if the IP address is the loopback address '::1'
     if (ipAddress === '::1') {
      // Provide default location information or return empty location
      return {
        country: 'Nigeria',
        city: 'Lagos',
      };
    }
    const client = new WebServiceClient(MAXMIND_USER_ID, MAXMIND_LICENSE_KEY, {
      host: "geolite.info",
    });
    const countryResponse = await client.country(ipAddress);
    const cityResponse = await client.city(ipAddress);

    // Extract the country and city from the response
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

//get long url
const getLongURL = async (shortURLId) => { 
  try {
    // Find the ShortURL document with the provided short URL
    const url = await ShortURL.findOne({ shortURL: shortURLId });
    if (!url) {
      throw new Error("Short URL not found");
    }
    return url;
  } catch (error) {
    console.error("Error getting analytics:", error);
    throw error;
  }
};



module.exports = {
  getShortURLsForUser,
  associateShortURLWithUser,
  getLocationByIp,
  getLongURL,
};
