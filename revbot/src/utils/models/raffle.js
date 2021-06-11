const mongoose = require('mongoose');

const raffleSchema = mongoose.Schema({
  userID: String,
  tickets: Number

});

module.exports = mongoose.model('Raffle', raffleSchema);
