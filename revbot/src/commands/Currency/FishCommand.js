const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const statsDB = require('../../utils/models/botstats.js');
module.exports = class FishCommand extends BaseCommand {
  constructor() {
    super('fish', 'Currency', [], 'fish', 'Fancy goin for a fish?');
  }

  async run(client, message, args) {
    let target = message.author;
    let giveVal = Math.floor(Math.random() * (5 - 1 + 1) + 1);
    let cooldown = 20000;
    let itemID = 'fish';
    let itemName = 'Fish';
    let sharkID = 'shark';
    let sharkName = 'Shark';
    let dolphinID = 'dolphin';
    let dolphinName = 'Dolphin';
    let bait = 'bait';
    let boat = 'boat';
    let hasBait = false;
    let rod = 'weightedrod';
    let hasRod = false;
    
    
    let cDB = await curDB.findOne({ userID: target.id });
    let dolphin = await itemDB.findOne({ itemID: dolphinID });
    let shark = await itemDB.findOne({ itemID: sharkID });
    if (cDB) {
      let lastFish = cDB.fishCD;
      let userInv = cDB.inventory;
      let boatCheck = userInv.find( ({ itemID }) => itemID === boat);
      if (boatCheck !== undefined) cooldown = Math.floor(cooldown - (cooldown * 0.10));
      let baitCheck = userInv.find( ({ itemID }) => itemID === bait);
      if (baitCheck !== undefined) hasBait = true;
      if (hasBait) giveVal = giveVal * 2;
      let rodCheck = userInv.find( ({ itemID }) => itemID === rod);
      if (rodCheck !== undefined) hasRod = true;
      if (lastFish !== null && cooldown - (Date.now() - lastFish) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastFish), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      } else {
        let stats = await statsDB.findOne({});
        if (stats) {
          stats.fishingTrips += 1;
          await stats.save().catch(err => console.log(err));
        } 
        let success = Math.floor(Math.random() * 11);
        console.log(success);
        if (success <= 3) {
          cDB.fishCD = Date.now();
          await cDB.save().catch(err => console.log(err));
          return message.reply("You failed to catch any fish. Trash lmao.");
        } else if (success >= 8 && hasRod) {
          let chooseFish = Math.floor(Math.random() * 2);
          let deepGiveVal = Math.floor(Math.random() * (3 - 1 + 1) + 1);
          if (hasBait) deepGiveVal = deepGiveVal * 2;
          let fishChosen;
          let fishName;
          let fishEmoji;
          if (chooseFish === 1) {
            fishChosen = sharkID;
            fishName = sharkName;
            fishEmoji = shark.icon;
            let deathChance = Math.random();
            if (deathChance <= 0.1) {
              death(cDB, message);
              return;
            } 
          } else {
            fishChosen = dolphinID;
            fishName = dolphinName;
            fishEmoji = dolphin.icon;
          }
          
          const deepDB = cDB.inventory;
          let item = deepDB.find( ({ itemID }) => itemID === fishChosen);
          if (item === undefined) {
            cDB.inventory.push({ itemName: fishName, itemID: fishChosen, userID: target.id, count: deepGiveVal })
          } else {
            item.count += deepGiveVal;
          }
          cDB.fishCD = Date.now();
          cDB.commands += 1;
          await cDB.save().catch(err => console.log(err));
          console.log(`${fishName} amount: ${deepGiveVal}`);
          console.log(target.username, cDB.userID, cDB.inventory, cDB.commands);
          
          await message.reply(`You feel a MASSIVE tug on the rod and start reeling...You caught ${deepGiveVal} ${fishName}s! ${fishEmoji}`).catch(err => console.log(err));
        } else {
          const fishDB = cDB.inventory;
          let item = fishDB.find( ({ itemID }) => itemID === 'fish');
          if (item === undefined) {
            cDB.inventory.push({ itemName: itemName, itemID: itemID, userID: target.id, count: giveVal })
          } else {
            item.count += giveVal;
          }
          cDB.fishCD = Date.now();
          cDB.commands += 1;
          await cDB.save().catch(err => console.log(err));
          console.log(`Fish amount: ${giveVal}`);
          console.log(target.username, cDB.userID, cDB.inventory, cDB.commands);
          
          await message.reply(`You feel a tug on the rod and start reeling...You caught ${giveVal} fish! 🐟`).catch(err => console.log(err));
        }
        
      } 
    } else {
      cDB = new curDB({
        userID: target.id,
        balance: 0,
        wallet: 0,
        commands: 0,
        fishCD: Date.now(),
      });
      await cDB.save().catch(err => console.log(err));
      let success = Math.floor(Math.random() * 11);
      if (success <= 4) {
        cDB.fishCD = Date.now();
        await cDB.save().catch(err => console.log(err));
        return message.reply("You failed to catch any fish. Trash lmao.");
      } 
      cDB.inventory.push({ itemName: itemName, itemID: itemID, userID: target.id, count: giveVal })
      console.log("New User:", target.username, cDB.userID , cDB.inventory, cDB.balance, cDB.commands);
      console.log(`Fish amount: ${giveVal}`);
      cDB.fishCD = Date.now();
      cDB.commands += 1;
      await cDB.save().catch(err => console.log(err));
      await message.reply(`You feel a tug on the rod and start reeling...You caught ${giveVal} fish! 🐟`).catch(err => console.log(err));
    }
  }
}

const death = (user, msg) => {
  msg.reply("The shark jumps out of the water directly towards you, turning you into a nice snack.")
  let userInv = user.inventory;
  let revivalID = 'revivalstone';
  let revivalCheck = userInv.find( ({itemID}) => itemID === revivalID);
  let revivalIndex = userInv.indexOf(revivalCheck);
  if (revivalCheck !== undefined) {
    revivalCheck.count -= 1;
    if (revivalCheck.count === 0) userInv.splice(revivalIndex, 1);
    msg.reply("Your Revival Stone has resurrected you, destroying itself in the process.");
    user.save();
    return;
  } else {
    user.wallet = 0;
    msg.reply("You died! Congrats, you lost everything in your wallet. :)");
    user.save();
    return;
  }
}