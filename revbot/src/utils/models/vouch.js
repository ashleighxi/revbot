const mongoose = require('mongoose');

const vouchSchema = mongoose.Schema({
  userID: String,
  vouches: Number

});

module.exports = mongoose.model('Vouch', vouchSchema);