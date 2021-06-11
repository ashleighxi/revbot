const mongoose = require('mongoose');

const eventsSchema = mongoose.Schema({
  event: String,
  date: String

});

module.exports = mongoose.model('Events', eventsSchema);