const mongoose = require('mongoose');

const botStatsSchema = mongoose.Schema({
  giveawaysPinged: { type: Number, default: 0 },
  giveawayDonations: { type: Number, default: 0 },
  heistsPinged: { type: Number, default: 0 },
  heistDonations: { type: Number, default: 0 },
  fishingTrips: { type: Number, default: 0 },
  huntingTrips: { type: Number, default: 0 },
  timesBegged: { type: Number, default: 0 },
  timesRobbed: { type: Number, default: 0 },
  timesLurked: { type: Number, default: 0 },
  timesWorked: { type: Number, default: 0 },
  timesBet: { type: Number, default: 0 },
  timesSlots: { type: Number, default: 0 },
  overallGained: { type: Number, default: 0 },
  overallLost: { type: Number, default: 0 },
  overallWins: { type: Number, default: 0 },
  overallLosses: { type: Number, default: 0 },
  overallNet: { type: Number, default: 0 },
  raids: { type: Number, default: 0 },
  adventures: { type: Number, default: 0 },
  dungeons: { type: Number, default: 0}
});

module.exports = mongoose.model('botStats', botStatsSchema);