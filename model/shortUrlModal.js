const mongoose = require("mongoose");
const shortId = require("shortid");
const validUrl = require("valid-url");

const shortURLSchema = new mongoose.Schema({
  longURL: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: function (value) {
        return validUrl.isWebUri(value);
      },
      message: "Invalid URL",
    },
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
