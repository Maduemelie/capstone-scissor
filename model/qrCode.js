// Assuming you have a User model defined

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// QRCode schema
const qrCodeSchema = new Schema({
  data: {
    type: String,
    required: true
  },
});

// QRCode model
const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;
