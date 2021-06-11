const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const statsDB = require('../../utils/models/botstats.js');
module.exports = class BegCommand extends BaseCommand {
  constructor() {
    super('beg', 'Currency', [], 'beg', 'Just beg 4Head.');
  }

  async run(client, message, args) {
    let target = message.author;
    let giveVal = Math.floor(Math.random() * (500 - 150 + 1) + 150);
    let cooldown = 10000;
    let cup = 'beggarscup';
    let hasCup = false;

    
    
    let cDB = await curDB.findOne({ userID: target.id });
    if (cDB) {
      let lastBeg = cDB.begCD;
      if (lastBeg !== null && cooldown - (Date.now() - lastBeg) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastBeg), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      } else {
        let stats = await statsDB.findOne({});
        if (stats) {
          stats.timesBegged += 1;
          await stats.save().catch(err => console.log(err));
        }
        let success = Math.floor(Math.random() * 11);
        console.log(success);
        let userInv = cDB.inventory;
        let cupCheck = userInv.find( ({ itemID }) => itemID === cup);
        if (cupCheck !== undefined) hasCup = true;
        if (hasCup) giveVal = giveVal * 2;
        if (success <= 2) {
          cDB.begCD = Date.now();
          await cDB.save().catch(err => console.log(err));
          return message.channel.send("You don't get anything this time, you dirty beggar.");
        }
        if (isNaN(cDB.wallet)) {
          cDB.wallet = giveVal;
        } else {
          cDB.wallet += giveVal;
        }
        cDB.begCD = Date.now();
        cDB.commands += 1;
        await cDB.save().catch(err => console.log(err));
        console.log(`Beg amount: $${giveVal}`);
        console.log(target.username,cDB.userID , cDB.wallet, cDB.commands);
        
        await message.reply(`You've managed to convince someone to spare you $${giveVal}. Pathetic.`).catch(err => console.log(err));
      } 
    } else {
      cDB = new curDB({
        userID: target.id,
        balance: 0,
        wallet: 0,
        commands: 0,
        begCD: Date.now()
      });
      await cDB.save().catch(err => console.log(err));
      let success = Math.floor(Math.random() * 11);
      if (success <= 3) {
        cDB.begCD = Date.now();
        await cDB.save().catch(err => console.log(err));
        return message.channel.send("You don't get anything this time, you dirty beggar.");
      }
      console.log("New User:", target.username, cDB.userID , cDB.wallet, cDB.balance, cDB.commands);
      console.log(`Beg amount: $${giveVal}`);
      cDB.wallet = giveVal;
      cDB.begCD = Date.now();
      cDB.commands += 1;
      await await cDB.save().catch(err => console.log(err));
      await message.reply(`You've managed to convince someone to spare you $${giveVal}. Pathetic.`).catch(err => console.log(err));
    }
  }
}