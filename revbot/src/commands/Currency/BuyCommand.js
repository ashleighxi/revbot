const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const FuzzySearch = require('fuzzy-search');
module.exports = class BuyCommand extends BaseCommand {
  constructor() {
    super('buy', 'Currency', [], 'buy', 'Buy things from Rev\'s Den');
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
    if (!args[0] || !isNaN(args[0])) return message.channel.send('You must give an item to buy `//buy <item> <amount>`');
    if (isNaN(giveVal)) return message.channel.send('bruh give me a number. `//buy <item> <amount>`');
    giveVal = Math.floor(giveVal);
    if (Number(giveVal) <= 0) return message.channel.send('hmmm... seems kinda sus ngl.');
    
    
    if (givenID.length < 2) return message.channel.send("That item doesn't even exist bro.");
    let cDB = await curDB.findOne({ userID: target.id });
    const items = await itemDB.find({});
    const searcher = new FuzzySearch(items, ['itemID'], { caseSensitive: false, sort: true});
    const result = searcher.search(givenID);
    let iDB = await itemDB.findOne({ itemID: result[0].itemID });
    if (!iDB) return message.channel.send("That item doesn't even exist bro.");
    const buyPrice = iDB.buyPrice;
    if (buyPrice === undefined) return message.channel.send("This item cannot be bought.");
    if (cDB) { 
        const userItems = cDB.inventory;
        let item = userItems.find( ({ itemID }) => itemID === result[0].itemID);
        const itemIndex = userItems.findIndex(({ itemID }) => itemID === result[0].itemID);
        if (item !== undefined){
          if (item.count === iDB.itemLimit) return message.channel.send(`You cannot purchase more than ${iDB.itemLimit} of these.`);
        }
        if (cDB.wallet < iDB.buyPrice * giveVal || cDB.wallet === undefined) {
          return message.channel.send("You don't have enough money to purchase that. Don't try to scam me.");
        } else if (item === undefined) {
          if (giveVal > iDB.itemLimit) return message.channel.send(`You may only have ${iDB.itemLimit} of these.`);
          cDB.inventory.push({ itemName: iDB.itemName, itemID: iDB.itemID, userID: target.id, count: giveVal })
          if(cDB.wallet >= iDB.buyPrice * giveVal) {
            cDB.wallet -= Number(buyPrice * giveVal);
          } 
          if (iDB.attack) cDB.stats.attack += iDB.attack;
          if (iDB.wisdom) cDB.stats.wisdom += iDB.wisdom;
          if (iDB.dexterity) cDB.stats.dexterity += iDB.dexterity;
        } else {
          cDB.inventory[itemIndex].count += Number(giveVal);
          if(cDB.wallet >= iDB.buyPrice * giveVal) {
            cDB.wallet -= Number(buyPrice * giveVal);
          } 
        }
        
        cDB.commands += 1;
        await cDB.save().catch(err => console.log(err));
        console.log(`${iDB.itemName} bought: ${giveVal} for ${buyPrice * giveVal}`);
        console.log(target.username, cDB.userID, cDB.inventory, cDB.wallet, cDB.commands);
        
        await message.channel.send(`You successfully bought ${Number(giveVal).toLocaleString()} ${iDB.itemName} for $${(buyPrice * giveVal).toLocaleString()}!`).catch(err => console.log(err));
    } else {
      cDB = new curDB({
        userID: target.id,
        balance: 0,
        wallet: 0,
        commands: 0,
      });
      await cDB.save().catch(err => console.log(err));
      
      console.log("New User:", target.username, cDB.userID , cDB.inventory, cDB.balance, cDB.commands);

      await message.channel.send(`You don't have enough money to purchase that. Don't try to scam me.`).catch(err => console.log(err));
    }
  }
}