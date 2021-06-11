const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const FuzzySearch = require('fuzzy-search');
module.exports = class SellCommand extends BaseCommand {
  constructor() {
    super('sell', 'Currency', [], 'sell', 'Sell items to Rev\'s Den!');
  }

  async run(client, message, args) {
    let target = message.author;
    let givenID = args[0];
    let giveVal;
    if (!args[1]) {
      giveVal = 1;
    } else {
      giveVal = args[1];
    }
    if (!args[0] || !isNaN(args[0])) return message.channel.send('You must give an item to sell `(p)sell <item> <amount>`');
    if (isNaN(giveVal)) return message.channel.send('bruh give me a number. `(p)sell <item> <amount>`');
    giveVal = Math.floor(giveVal);
    if (Number(giveVal) <= 0) return message.channel.send('hmmm... seems kinda sus ngl.');
    
    if (givenID.length < 2) return message.channel.send("That item doesn't even exist bro.");
    let cDB = await curDB.findOne({ userID: target.id });
    const items = await itemDB.find({});
    const searcher = new FuzzySearch(items, ['itemID'], { sort: true});
    const result = searcher.search(givenID);
    let iDB = await itemDB.findOne({ itemID: result[0].itemID });
    if (!iDB) return message.channel.send("That item doesn't even exist bro.");
    const sellPrice = iDB.itemPrice;
    if (cDB) { 
        const userItems = cDB.inventory;
        let item = userItems.find( ({ itemID }) => itemID === result[0].itemID);
        const itemIndex = userItems.indexOf(item);
        if (item === undefined) {
          return message.channel.send("You don't even own that item man. Don't try to scam me.");
        } else {
          console.log(userItems);
          if (Number(item.count) - Number(giveVal) < 0) return message.channel.send("You don't have that many of that item.");
          item.count -= giveVal;
          if(cDB.wallet === undefined) {
            cDB.wallet = sellPrice * giveVal;
          } else {
            cDB.wallet += sellPrice * giveVal;
          }
        }
        
        if (item.count === 0) {
          userItems.splice(itemIndex,1);
          if (iDB.attack) cDB.stats.attack -= iDB.attack;
          if (iDB.wisdom) cDB.stats.wisdom -= iDB.wisdom;
          if (iDB.dexterity) cDB.stats.dexterity -= iDB.dexterity;
        }
        cDB.commands += 1;
        await cDB.save().catch(err => console.log(err));
        console.log(`${iDB.itemName} sold: ${giveVal} for ${sellPrice * giveVal}`);
        console.log(target.username, cDB.userID, cDB.inventory, cDB.wallet, cDB.commands);
        
        await message.channel.send(`You successfully sold ${giveVal} ${iDB.itemName} for $${(sellPrice * giveVal).toLocaleString()}!`).catch(err => console.log(err));
    } else {
      cDB = new curDB({
        userID: target.id,
        balance: 0,
        wallet: 0,
        commands: 0,
      });
      await cDB.save().catch(err => console.log(err));
      
      console.log("New User:", target.username, cDB.userID , cDB.inventory, cDB.balance, cDB.commands);

      await message.channel.send(`You don't even own that item man. Don't try to scam me.`).catch(err => console.log(err));
    }
  }
}