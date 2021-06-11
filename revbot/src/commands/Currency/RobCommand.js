const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const humanizeDuration = require('humanize-duration');
const statsDB = require('../../utils/models/botstats.js');
const itemDB = require('../../utils/models/item.js');
module.exports = class RobCommand extends BaseCommand {
  constructor() {
    super('rob', 'Currency', ['steal'], 'rob', 'Participate in criminal activities.');
  }

  async run(client, message, args) {
    let target = message.author;
    const cooldown = 60000 * 5;
    let crowbar = 'crowbar';
    let hasCrow = false;
    let options = new Map();
    options.set('apartment', {name: 'apartment', diff: 1});
    options.set('house', {name: 'house', diff: 2});
    options.set('store', {name: 'store', diff: 3});
    options.set('bank', {name: 'bank', diff: 4});
    let reward = Math.floor(Math.random() * (10000 - 5000 + 5000) + 5000);
    let items = await itemDB.find({});
    let choice;
    const filter = response => {
      choice = options.get(response.content.toLowerCase());
      if (response.author.id !== target.id) {
        console.log('not the invoker.');
      } else if (choice !== undefined) {
        return choice !== undefined;
      } else {
        choice = false;
        return true;
      }
    }

    let user = await userDB.findOne({ userID: target.id });
    let lastRob = user.robCD;
    if (lastRob !== null && cooldown - (Date.now() - lastRob) > 0) {
      let timeObj = humanizeDuration(cooldown - (Date.now() - lastRob), { round: true });
      console.log(timeObj);
      return message.channel.send(`You must wait ${timeObj} before running that command again.`);
    } else {
      let stats = await statsDB.findOne({});
      if (stats) {
        stats.timesRobbed += 1;
        await stats.save().catch(err => console.log(err));
      }
      let userInv = user.inventory;
      let dexterity = 1;
      let crowCheck = userInv.find( ({ itemID }) => itemID === crowbar );
      if (crowCheck !== undefined) hasCrow = true;
      if (hasCrow === false) return message.channel.send("You need a crowbar to use this command.");
      userInv.forEach(item => {
        let current = items.find( ({itemID}) => itemID === item.itemID);
        if (current.dexterity){
          dexterity += current.dexterity;
        }
      });
      message.channel.send(`Ready for a night of crime? Choose your target...\n\`${options.get('apartment').name}\`, \`${options.get('house').name}\`, \`${options.get('store').name}\`, \`${options.get('bank').name}\``).then(() => {
        message.channel.awaitMessages(filter, { max: 1, time: 10000, errors: ['time'] })
        .then( collected => {
          let success = Math.floor(Math.random() * 101);
          if (choice === false) return message.channel.send("That's not even an option bro.");
          reward = reward * choice.diff;
          if ((success/choice.diff) + (dexterity * 2) >= 20) {
            
            if (user) {
              user.wallet += Number(reward);
              user.commands += 1;
              user.robCD = Date.now();
              user.save();
            } else {
              user = new userDB({
                userID: target.id,
                balance: 0,
                wallet: reward,
                commands: 1,
                robCD: Date.now()
              });
              user.save();
            }
            message.channel.send(`You successfully robbed the ${choice.name}!\nYou made it out with $${reward.toLocaleString()} :sunglasses:`);
          } else {
            message.channel.send(`LOL YOU GOT BUSTED!\nYou had to pay a fine of $${Math.floor(reward/5).toLocaleString()}...`);
            if (user) {
              if (Number(user.wallet) < Math.floor(reward/5)) {
                user.wallet = 0;
              } else {
                user.wallet -= Math.floor(reward/5);
              }
              user.commands += 1;
              user.robCD = Date.now();
              user.save();
            }
          }
        }).catch( collected => {
          if (choice !== false) {
            message.channel.send("You didn't respond in time.");
          }
          user.robCD = Date.now();
          user.save();
        });
      });
      await user.save().catch(err => console.log(err));
    }
  }
}