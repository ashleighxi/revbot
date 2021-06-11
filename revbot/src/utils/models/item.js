const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
  itemName: String,
  itemID: String,
  itemPrice: Number,
  purchaseable: Boolean,
  buyPrice: Number,
  itemLimit: Number,
  description: String,
  effect: String,
  icon: String,
  usable: Boolean,
  craftable: Boolean,
  attack: Number,
  wisdom: Number,
  dexterity: Number,
  type: String
});

module.exports = mongoose.model('Item', itemSchema);