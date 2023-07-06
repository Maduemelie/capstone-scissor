const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  shortURL: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShortURL',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  location: {
    type: {
      country: {
        type: String
      },
      city: {
        type: String
      },
      postalCode: {
        type: String
      }
    }
  }
});

const Analytics = mongoose.model('Analytics', AnalyticsSchema);

module.exports = Analytics;
