const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
const statsDB = require('../../utils/models/botstats.js');
module.exports = class HuntCommand extends BaseCommand {
  constructor() {
    super('hunt', 'Currency', [], 'hunt', 'Hunt deep in the wilderness for mighty beasts.');
  }

  async run(client, message, args) {
    let target = message.author;
    let giveVal = 1;
    let cooldown = 15000;
    let animalMap = new Map();
    animalMap.set('deer', { itemID: 'deer', itemName: 'Deer' });
    animalMap.set('rat', { itemID: 'rat', itemName: 'Rat' });
    animalMap.set('turkey', { itemID: 'turkey', itemName: 'Turkey' });
    animalMap.set('bear', { itemID: 'bear', itemName: 'Bear' });
    let animalChooser = Math.floor(Math.random() * 96);
    let animal;
    if (animalChooser <= 35) {
      animal = animalMap.get('rat');
    } else if (animalChooser <= 60) {
      animal = animalMap.get('deer');
    } else if (animalChooser <= 80) {
      animal = animalMap.get('turkey');
    } else {
      animal = animalMap.get('bear');
    }
    let gun = 'gun';
    let hasGun = false;
    
    
    
    let cDB = await curDB.findOne({ userID: target.id });
    if (cDB) {
      let lastHunt = cDB.huntCD;
      let userInv = cDB.inventory;
      let gunCheck = userInv.find( ({ itemID }) => itemID === gun);
      if (gunCheck !== undefined) hasGun = true;
      if (lastHunt !== null && cooldown - (Date.now() - lastHunt) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastHunt), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      } else {
        let stats = await statsDB.findOne({});
        if (stats) {
          stats.huntingTrips += 1;
          await stats.save().catch(err => console.log(err));
        }
        let success = Math.floor(Math.random() * 11);
        console.log(success);
        if(hasGun) {
          if (success <= 2) {
            cDB.huntCD = Date.now();
            await cDB.save().catch(err => console.log(err));
            return message.reply("You line up your sight, take a deep breath, and pull the trigger... you missed lmfao.");
          } 
        } else {
          if (success <= 3) {
            cDB.huntCD = Date.now();
            await cDB.save().catch(err => console.log(err));
            return message.reply("You line up your sight, take a deep breath, and pull the trigger... you missed lmfao.");
          } 
        }
        
        const huntDB = cDB.inventory;
        let item = huntDB.find( ({ itemID }) => itemID === animal.itemID);
        if (item === undefined) {
          cDB.inventory.push({ itemName: animal.itemName, itemID: animal.itemID, userID: target.id, count: giveVal })
        } else {
          item.count += giveVal;
        }
        cDB.huntCD = Date.now();
        cDB.commands += 1;
        await cDB.save().catch(err => console.log(err));
        console.log(`${animal.itemName} amount: ${giveVal}`);
        console.log(target.username, cDB.userID, cDB.inventory, cDB.commands);
        
        await message.reply(`You line up your sight, take a deep breath, and pull the trigger...You caught ${giveVal} ${animal.itemName}!`).catch(err => console.log(err));
      } 
    } else {
      cDB = new curDB({
        userID: target.id,
        balance: 0,
        wallet: 0,
        commands: 0,
        huntCD: Date.now(),
      });
      await cDB.save().catch(err => console.log(err));
      let success = Math.floor(Math.random() * 11);
      if (success <= 4) {
        cDB.huntCD = Date.now();
        await cDB.save().catch(err => console.log(err));
        return message.reply("You line up your sight, take a deep breath, and pull the trigger... you missed lmfao.");
      } 
      cDB.inventory.push({ itemName: itemName, itemID: itemID, userID: target.id, count: giveVal })
      console.log("New User:", target.username, cDB.userID , cDB.inventory, cDB.balance, cDB.commands);
      console.log(`${animal.itemName} amount: ${giveVal}`);
      cDB.huntCD = Date.now();
      cDB.commands += 1;
      await cDB.save().catch(err => console.log(err));
      await message.reply(`You line up your sight, take a deep breath, and pull the trigger...You caught ${giveVal} ${animal.itemName}!`).catch(err => console.log(err));
    }
  }
}