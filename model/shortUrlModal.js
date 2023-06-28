const mongoose = require("mongoose");
const shortId = require("shortid");

const shortURLSchema = new mongoose.Schema({
  longURL: {
    type: String,
    unique: true,
    required: true,
  },
  shortURL: {
    type: String,
    required: true,
    default: shortId.generate,
  },
  customURL: {
    type: String,
    unique: true,
    sparse: true,
  },
  visits: {
    type: Number,
    default: 0,
  },
});

const ShortURL = mongoose.model("ShortURL", shortURLSchema);

module.exports = ShortURL;
