const User = require("../model/userModel");
const ShortURL = require("../model/shortUrlModal");

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
module.exports = { getShortURLsForUser, associateShortURLWithUser };