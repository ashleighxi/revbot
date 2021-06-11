const mongoose = require('mongoose');

const afkSchema = mongoose.Schema({
  userID: String,
  reason: String

});

module.exports = mongoose.model('AFK', afkSchema);