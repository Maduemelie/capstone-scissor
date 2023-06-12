const mongoose = require('mongoose');
const shortId = require('shortid')

const shortURLSchema = new mongoose.Schema({
  longURL: {
    type: String,
    required: true,
  },
  shortURL: {
    type: String,
      required: true,
    default: shortId.generate
  },
  visits: {
    type: Number,
    default: 0,
  },
});

const ShortURL = mongoose.model('ShortURL', shortURLSchema);

module.exports = ShortURL;
