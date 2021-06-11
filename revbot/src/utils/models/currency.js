const mongoose = require('mongoose');
var statsSchema = new mongoose.Schema({
  attack: { type: Number, default: 1}, 
  wisdom: { type: Number, default: 1}, 
  dexterity: { type: Number, default: 1}
});
var statusDetailsSchema = new mongoose.Schema({
  state: { type: Boolean, default: false },
  duration: { type: Number, default: 0 },
  chance: { type: Number, default: 0 }
});
var statusSchema = new mongoose.Schema({
  stun: { type: statusDetailsSchema, default: () => ({})}
});
const curSchema = mongoose.Schema({
  userID: String,
  wallet: { type: Number, default: 0},
  balance: { type: Number, default: 0},
  bank: { type: Number, default: 0},
  bankLimit: { type: Number, default: 1000000},
  commands: { type: Number, default: 0},
  dailyCD: Number,
  begCD: Number,
  workCD: Number,
  fishCD: Number,
  huntCD: Number,
  betCD: Number,
  cfCD: Number,
  lurkCD: Number,
  slotsCD: Number,
  useCD: Number,
  robCD: Number,
  raidCD: Number,
  raidStartCD: Number,
  ventureCD: Number,
  dungeonCD: Number,
  dungeonStartCD: Number,
  status: { type: statusSchema, default: () => ({})},
  class: { type: String, default: 'none'},
  health: { type: Number, default: 250},
  stats: { type: statsSchema, default: () => ({}) },
  gamble: new mongoose.Schema({ wins: Number, losses: Number, gained: Number, lost: Number}),
  inventory: [new mongoose.Schema({ itemName: String, itemID: String, userID: String, count: Number })]

});

module.exports = mongoose.model('Currency', curSchema);