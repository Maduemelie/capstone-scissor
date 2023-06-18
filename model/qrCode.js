// Assuming you have a User model defined

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// QRCode schema
const qrCodeSchema = new Schema({
  data: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// QRCode model
const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;
