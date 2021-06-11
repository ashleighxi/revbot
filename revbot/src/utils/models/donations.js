const mongoose = require('mongoose');

const donoSchema = mongoose.Schema({
  id: String,
  donations: [new mongoose.Schema({
    guild: String,
    amount: Number,
  })],
  roles: [String]

});

module.exports = mongoose.model('Donations', donoSchema);