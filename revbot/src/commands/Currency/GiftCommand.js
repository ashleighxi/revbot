const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const FuzzySearch = require('fuzzy-search');
module.exports = class GiftCommand extends BaseCommand {
  constructor() {
    super('gift', 'Currency', [], 'gift', 'Gift another player an item!');
  }

  async run(client, message, args) {
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[2]);
    if (target) target = target.user;
    if (!target) return message.channel.send('You must state a user to gift to. `(p)gift <amount> <item> @user`');
    if (!args[1]) return message.channel.send('You must state an item to gift `(p)gift <amount> <item> @user`');
    if (!args[0] || isNaN(args[0])) return message.channel.send('You must state an amount of an item to gift `//gift <amount> <item> @user`');
    let amount = Number(args[0]);
    amount = Math.floor(amount);
    if (amount <= 0) return message.channel.send('you successfully trade nothing dumbass. good job.');
    let item = args[1];
    if (message.author.id === target.id) return message.channel.send("You can't give yourself items, cheater.");
    
    let gifter = await userDB.findOne({ userID: message.author.id });
    let giftee = await userDB.findOne({ userID: target.id });
    const items = await itemDB.find({});
    const searcher = new FuzzySearch(items, ['itemID'], {sort: true});
    const result = searcher.search(item);
    //Check if gifter has the item
    if (gifter) {
      let gifterInv = gifter.inventory;
      if (gifterInv === undefined) return message.channel.send("You are too new to gift items.");
      let gifterHasItem = gifterInv.find( ({ itemID }) => itemID === result[0].itemID );
      let gifterItemIndex = gifterInv.indexOf(gifterHasItem);
      if (gifterHasItem) {
        //Check if giftee has the item
        if (gifterHasItem.count < amount) return message.channel.send('You do not have that many to gift.');
        if (giftee) {
          let gifteeInv = giftee.inventory;
          if (gifteeInv === undefined) return message.channel.send("This person is too new to receive items.");
          let gifteeHasItem = gifteeInv.find( ({ itemID }) => itemID === result[0].itemID );
          let gifteeItemIndex = gifteeInv.indexOf(gifteeHasItem);
          if (gifteeHasItem) {
            gifteeHasItem.count += amount;
          } else {
            gifteeInv.push({ itemID: result[0].itemID, itemName: gifterHasItem.itemName, userID: target.id, count: amount });
            if (result[0].attack) giftee.stats.attack += result[0].attack;
            if (result[0].wisdom) giftee.stats.wisdom += result[0].wisdom;
            if (result[0].dexterity) giftee.stats.dexterity += result[0].dexterity;
          }
          
          gifterHasItem.count -= amount;
          if (gifteeHasItem === undefined) {
            message.reply(`you have succesfully sent ${amount} ${gifterHasItem.itemName} to ${target.username}. You now have ${gifterHasItem.count} and they have ${amount}.`);
          } else {
            message.reply(`you have succesfully sent ${amount} ${gifterHasItem.itemName} to ${target.username}. You now have ${gifterHasItem.count} and they have ${gifteeHasItem.count}.`);
          }
          
          if (gifterHasItem.count === 0) {
            gifterInv.splice(gifterItemIndex, 1);
            if (result[0].attack) gifter.stats.attack -= result[0].attack;
            if (result[0].wisdom) gifter.stats.wisdom -= result[0].wisdom;
            if (result[0].dexterity) gifter.stats.dexterity -= result[0].dexterity;
          }
          
          await giftee.save().catch(err => console.log(err));
          await gifter.save().catch(err => console.log(err));
        } else {
          return message.channel.send("This person is too new to receive items.");
        }
      } else {
        return message.channel.send("You don't own that item or it doesn't exist.");
      }
    } else {
      return message.channel.send("You are too new to gift items.");
    }
    
  }
}