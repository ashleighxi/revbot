const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const statsDB = require('../../utils/models/botstats.js');
module.exports = class WorkCommand extends BaseCommand {
  constructor() {
    super('work', 'Currency', [], 'work', 'Use a little elbow grease out on the job.');
  }

  async run(client, message, args) {
    let target = message.author;
    let giveVal = Math.floor(Math.random() * (2000 - 1000 + 1) + 1000);
    let cooldown = 600000;
    let workArray = [`You donate your body to science, earning you $${giveVal}. All of your body hair is now rainbow colored.`, `You managed to successfully spy on the Russians, earning you $${giveVal}. Capitalism forever, amirite?`, `You gave a massage to an old lady at a nursing home, earning you $${giveVal}. Please go wash your hands.`];
    let responseIndex = Math.floor(Math.random() * 3);
    let response = workArray[responseIndex];
    
    
    let cDB = await curDB.findOne({ userID: target.id });
    if (cDB) {
      let lastWork = cDB.workCD;
      if (lastWork !== null && cooldown - (Date.now() - lastWork) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastWork), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      } else {
        let stats = await statsDB.findOne({});
        if (stats) {
          stats.timesWorked += 1;
          await stats.save().catch(err => console.log(err));
        }
        // let success = Math.floor(Math.random() * 11);
        // console.log(success);
        // if (success <= 4) return message.channel.send("You don't get anything this time, you dirty beggar.");
        if (isNaN(cDB.wallet)) {
          cDB.wallet = giveVal;
        } else {
          cDB.wallet += giveVal;
        }
        cDB.workCD = Date.now();
        cDB.commands += 1;
        await cDB.save().catch(err => console.log(err));
        console.log(`Work amount: $${giveVal}`);
        console.log(target.username,cDB.userID , cDB.wallet, cDB.commands);
        
        await message.channel.send(response).catch(err => console.log(err));
      } 
    } else {
      cDB = new curDB({
        userID: target.id,
        balance: 0,
        wallet: 0,
        commands: 0,
        workCD: Date.now()
      });
      await cDB.save().catch(err => console.log(err));
      // let success = Math.floor(Math.random() * 11);
      // if (success <= 4) return message.channel.send("You don't get anything this time, you dirty beggar.");
      console.log("New User:", target.username, cDB.userID , cDB.wallet, cDB.balance, cDB.commands);
      console.log(`Work amount: $${giveVal}`);
      cDB.wallet = giveVal;
      cDB.workCD = Date.now();
      cDB.commands += 1;
      await await cDB.save().catch(err => console.log(err));
      await message.channel.send(response).catch(err => console.log(err));
    }
  }
}