const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const statsDB = require('../../utils/models/botstats.js');
const humanizeDuration = require('humanize-duration');
module.exports = class VentureCommand extends BaseCommand {
  constructor() {
    super('venture', 'Currency', ['vent'], 'venture', 'Venture down the beaten path in search of some trouble.');
  }

  async run(client, message, args) {
    let target = message.author;
    let cooldown = 60000 * 5;
    let multi = 0.6;
    let user = await userDB.findOne({ userID: target.id });
    let items = await itemDB.find({});
    let stats = await statsDB.findOne({});
    let monsters = ['Goblin', 'Troll', 'Wolf', 'Highwayman', 'Dark Wizard'];
    let monsterChosen = Math.floor(Math.random() * monsters.length);
    let monster = monsters[monsterChosen];
    let reward = Math.floor((Math.random() * 25000) + 10000)
    let filter = response => response.author.id === target.id && response.content.toLowerCase() === 'strike';
    if (user) {
      let lastVenture = user.ventureCD;
      if (lastVenture !== null && cooldown - (Date.now() - lastVenture) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastVenture), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      } else {
        stats.adventures += 1;
        stats.save();
        user.ventureCD = Date.now();
        await user.save();
        let inventory = user.inventory;
        inventory.forEach( item => {
          let current = items.find( ({itemID}) => itemID === item.itemID);
          if (current.attack) multi += (current.attack * 0.1);
        });
        message.channel.send(`As you walk along the withered path, a ${monster} approaches!\nQuickly, use \`strike\` to kill him before he kills you!`);
        const msgs = await message.channel.awaitMessages(filter, { max: 1, time: 10000});
        if (msgs.size > 0) {
          let compRoll = Math.random();
          if (multi > compRoll) {
            message.reply(`You slay the ${monster} after an intense battle!\nAs you pillage it's corpse, you find **$${reward.toLocaleString()}**!`);
            if (user.wallet === undefined) {
              user.wallet = reward;
            } else {
              user.wallet += reward;
            }
            await user.save().catch(err => console.log(err));
          } else {
            let deathRoll = Math.random();
            if (deathRoll >= 0.1) {
              message.reply(`after a brief scuffle, the ${monster} finds a moment to escape!`);
            } else {
              message.reply(`You just got absolutely destroyed by that ${monster} LMAO.`);
              death(message, user);
            }
          }
        } else {
          let deathRoll = Math.random();
          if (deathRoll >= 0.3) {
            message.reply(`The ${monster} caught you by surprise, but thankfully you were able to escape!`);
          } else {
            message.reply(`You just got absolutely destroyed by that ${monster} LMAO. Pay more attention next time.`);
            death(message, user);
          }
        }
      }
    }
  }
}

async function death(msg, user) {
  let userInv = user.inventory;
  let revivalID = 'revivalstone';
  let revivalCheck = userInv.find(({ itemID }) => itemID === revivalID);
  let revivalIndex = userInv.indexOf(revivalCheck);
  if (revivalCheck !== undefined) {
    revivalCheck.count -= 1;
    if (revivalCheck.count === 0)
      userInv.splice(revivalIndex, 1);
    msg.channel.send(`<@!${user.userID}> Your Revival Stone has resurrected you, destroying itself in the process.`);
    user.save();
    return;
  } else {
    user.wallet = 0;
    msg.channel.send(`<@!${user.userID}> You died! Congrats, you lost everything in your wallet. :)`);
    user.save();
    return;
  }
}