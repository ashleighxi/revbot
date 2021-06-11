const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const humanizeDuration = require('humanize-duration');
const FuzzySearch = require('fuzzy-search');
module.exports = class UseCommand extends BaseCommand {
  constructor() {
    super('use', 'Currency', [], 'use', 'Use an item.');
  }

  async run(client, message, args) {
    let target = message.author;
    let cooldown = 3000;
    let item = args[0];
    let items = await itemDB.find({}).catch(err => console.log(err));
    let user = await userDB.findOne({ userID: target.id }).catch(err => console.log(err));
    const searcher = new FuzzySearch(items, ['itemID'], { sort: true });
    const result = searcher.search(item);
    if (user) {
      let lastUse = user.useCD;
      if (lastUse !== null && cooldown - (Date.now() - lastUse) > 0) {
        let timeObj = humanizeDuration(cooldown - (Date.now() - lastUse), { round: true });
        console.log(timeObj);
        return message.channel.send(`You must wait ${timeObj} before running that command again.`);
      }
      user.useCD = Date.now();
      await user.save().catch(err => console.log(err));
      let userInv = user.inventory;
      let isItem = items.find( (element) => element.itemID === result[0].itemID);
      if (!isItem) return message.channel.send("That's not even an item.");
      let hasItem = userInv.find( (element) => element.itemID === result[0].itemID);
      if (!hasItem) return message.channel.send("You don't even own that item.");
      if (!isItem.usable) return message.channel.send("This item cannot be used.");
      let itemIndex = userInv.indexOf(hasItem);
      if (hasItem.itemID === 'coffer') {
        let amountToUse = args[1];
        if (amountToUse === 'max' || amountToUse === 'all') amountToUse = Number(hasItem.count);
        if (amountToUse !== 'max' && amountToUse !== 'all') amountToUse = Number(amountToUse);
        if (!amountToUse) amountToUse = 1;
        amountToUse = Math.floor(amountToUse);
        if (isNaN(amountToUse)) return message.channel.send('This is not a valid amount.');
        if (amountToUse > hasItem.count) return message.channel.send("You don't have that many.");
        if (amountToUse <= 0) return message.channel.send("Cmon bruh, really? Use 0? smh my head.");
        
        user.bankLimit += (amountToUse * Number(20000));
        hasItem.count -= amountToUse;
        if (hasItem.count === 0) {
          userInv.splice(itemIndex, 1);
        }
        user.commands += 1;
        await user.save().catch(err => console.log(err));
        await message.channel.send(`You've unlocked ${amountToUse} coffer(s), increasing your bank space by **$${(amountToUse * 20000).toLocaleString()}**! You now have **$${user.bankLimit.toLocaleString()}** in bank space!`).catch(err => console.log(err));
      } else if (hasItem.itemID === 'spidersfang') {
        let itemToEnchant = args[1];
        if (!itemToEnchant) return message.channel.send('Please provide a melee weapon to enchant. `(p)use spidersfang <weapon>`');
        const itemResult = searcher.search(itemToEnchant);
        if (!itemResult[0]) return message.channel.send('Please provide a melee weapon to enchant. `(p)use spidersfang <weapon>`');
        if (itemResult[0].type !== 'melee') return message.channel.send('Please provide a melee weapon to enchant. `(p)use spidersfang <weapon>`');
        if (itemResult[0].itemID === 'dagger') {
          let hasDagger = userInv.find( ({itemID}) => itemID === 'dagger');
          let daggerIndex = userInv.indexOf(hasDagger);
          if (!hasDagger) return message.channel.send("It doesn't appear that you own a dagger.");
          hasDagger.count -= 1;
          if (hasDagger.count === 0) {
            userInv.splice(daggerIndex, 1);
            user.stats.attack -= itemToEnchant.attack;
          }
          let piercer = items.find( (element) => element.itemID === 'fangpiercer');
          let hasPiercer = userInv.find( ({itemID}) => itemID === 'fangpiercer');
          if (hasPiercer) {
            hasPiercer.count += 1;
          } else {
            userInv.push({itemID: 'fangpiercer', itemName: 'Fang Piercer', userID: user.userID, count: 1});
            user.stats.attack += piercer.attack;
          }
          hasItem.count -= 1;
          if (hasItem.count === 0) {
            userInv.splice(itemIndex, 1);
          }
          user.commands += 10;
          await user.save().catch(err => console.log(err));
          await message.channel.send("You successfully turn your Dagger into a Fang Piercer!");
        } else if (itemResult[0].itemID === 'sword') {
          let hasSword = userInv.find( ({itemID}) => itemID === 'sword');
          let swordIndex = userInv.indexOf(hasSword);
          if (!hasSword) return message.channel.send("It doesn't appear that you own a sword.");
          hasSword.count -= 1;
          if (hasSword.count === 0) {
            userInv.splice(swordIndex, 1);
            user.stats.attack -= itemToEnchant.attack;
          }
          let blade = items.find( (element) => element.itemID === 'fangblade');
          let hasBlade = userInv.find( ({itemID}) => itemID === 'fangblade');
          if (hasBlade) {
            hasBlade.count += 1;
          } else {
            userInv.push({itemID: 'fangblade', itemName: 'Fang Blade', userID: user.userID, count: 1});
            user.stats.attack += blade.attack;
          }
          hasItem.count -= 1;
          if (hasItem.count === 0) {
            userInv.splice(itemIndex, 1);
          }

          user.commands += 10;
          await user.save().catch(err => console.log(err));
          await message.channel.send("You successfully turn your Sword into a Fang Blade!");
        }
      } else if (hasItem.itemID === 'essenceoflife') {
        let amountToUse = args[1];
        if (amountToUse === 'max' || amountToUse === 'all') amountToUse = Number(hasItem.count);
        if (amountToUse !== 'max' && amountToUse !== 'all') amountToUse = Number(amountToUse);
        if (!amountToUse) amountToUse = 1;
        amountToUse = Math.floor(amountToUse);
        if (isNaN(amountToUse)) return message.channel.send('This is not a valid amount.');
        if (amountToUse > hasItem.count) return message.channel.send("You don't have that many.");
        if (amountToUse <= 0) return message.channel.send("Cmon bruh, really? Use 0? smh my head.");
        
        user.health += (amountToUse * Number(25));
        hasItem.count -= amountToUse;
        if (hasItem.count === 0) {
          userInv.splice(itemIndex, 1);
        }
        user.commands += 10;
        await user.save().catch(err => console.log(err));
        await message.channel.send(`You've consumed ${amountToUse} Essence of Life, increasing your health by **${(amountToUse * 25).toLocaleString()}**! You now have **${user.health.toLocaleString()}** total health!`).catch(err => console.log(err));
      } else if (hasItem.itemID === 'bloodvial') {
        let amountToUse = args[1];
        if (amountToUse === 'max' || amountToUse === 'all') amountToUse = Number(hasItem.count);
        if (amountToUse !== 'max' && amountToUse !== 'all') amountToUse = Number(amountToUse);
        if (!amountToUse) amountToUse = 1;
        amountToUse = Math.floor(amountToUse);
        if (isNaN(amountToUse)) return message.channel.send('This is not a valid amount.');
        if (amountToUse > hasItem.count) return message.channel.send("You don't have that many.");
        if (amountToUse <= 0) return message.channel.send("Cmon bruh, really? Use 0? smh my head.");
        
        user.health += (amountToUse * Number(30));
        hasItem.count -= amountToUse;
        if (hasItem.count === 0) {
          userInv.splice(itemIndex, 1);
        }
        user.commands += 10;
        await user.save().catch(err => console.log(err));
        await message.channel.send(`You've consumed ${amountToUse} Blood Vial(s), increasing your health by **${(amountToUse * 30).toLocaleString()}**! You now have **${user.health.toLocaleString()}** total health!`).catch(err => console.log(err));
      } else if (hasItem.itemID === 'voidcore') {
        let itemToEnchant = args[1];
        if (!itemToEnchant) return message.channel.send('Please provide a magic weapon to enchant. `(p)use voidcore <weapon>`');
        const itemResult = searcher.search(itemToEnchant);
        if (!itemResult[0]) return message.channel.send('Please provide a magic weapon to enchant. `(p)use voidcore <weapon>`');
        if (itemResult[0].type !== 'magic') return message.channel.send('Please provide a magic to enchant. `(p)use voidcore <weapon>`');
        if (itemResult[0].itemID === 'ancienttome') {
          let hasTome = userInv.find( ({itemID}) => itemID === 'ancienttome');
          let tomeIndex = userInv.indexOf(hasTome);
          if (!hasTome) return message.channel.send("It doesn't appear that you own an ancient tome.");
          hasTome.count -= 1;
          if (hasTome.count === 0) {
            userInv.splice(tomeIndex, 1);
            user.stats.wisdom -= itemResult[0].wisdom;
          }
          let runic = items.find( (element) => element.itemID === 'runicpower');
          let hasRunic = userInv.find( ({itemID}) => itemID === 'runicpower');
          if (hasRunic) {
            hasRunic.count += 1;
          } else {
            userInv.push({itemID: 'runicpower', itemName: 'Runic Power', userID: user.userID, count: 1});
            user.stats.wisdom += runic.wisdom;
            user.stats.attack += runic.attack;
            user.stats.dexterity += runic.dexterity;
          }
          hasItem.count -= 1;
          if (hasItem.count === 0) {
            userInv.splice(itemIndex, 1);
          }
          user.commands += 10;
          await user.save().catch(err => console.log(err));
          await message.channel.send("You successfully turn your Ancient Tome into a Runic Power!");
        } else if (itemResult[0].itemID === 'gemstaff') {
          let hasStaff = userInv.find( ({itemID}) => itemID === 'gemstaff');
          let staffIndex = userInv.indexOf(hasStaff);
          if (!hasStaff) return message.channel.send("It doesn't appear that you own a Gem Staff.");
          hasStaff.count -= 1;
          if (hasStaff.count === 0) {
            userInv.splice(staffIndex, 1);
            user.stats.wisdom -= itemResult[0].wisdom;
          }
          let voidStaff = items.find( (element) => element.itemID === 'voidstaff');
          let hasVoidStaff = userInv.find( ({itemID}) => itemID === 'voidstaff');
          if (hasVoidStaff) {
            hasVoidStaff.count += 1;
          } else {
            userInv.push({itemID: 'voidstaff', itemName: 'Void Staff', userID: user.userID, count: 1});
            user.stats.wisdom += voidStaff.wisdom;
            user.health += 25;
          }
          hasItem.count -= 1;
          if (hasItem.count === 0) {
            userInv.splice(itemIndex, 1);
          }

          user.commands += 10;
          await user.save().catch(err => console.log(err));
          await message.channel.send("You successfully turn your Gem Staff into a Void Staff!");
        }
      } else if (hasItem.itemID === 'sharpenedneedle') {
        let itemToEnchant = args[1];
        if (!itemToEnchant) return message.channel.send('Please provide a cutlass to enchant. `(p)use sharpenedneedle <weapon>`');
        const itemResult = searcher.search(itemToEnchant);
        if (!itemResult[0]) return message.channel.send('Please provide a cutlass to enchant. `(p)use sharpenedneedle <weapon>`');
        if (itemResult[0].type !== 'melee') return message.channel.send('Please provide a cutlass to enchant. `(p)use sharpenedneedle <weapon>`');
        if (itemResult[0].itemID === 'cutlass') {
          let hasCutlass = userInv.find( ({itemID}) => itemID === 'cutlass');
          let cutlassIndex = userInv.indexOf(hasCutlass);
          if (!hasCutlass) return message.channel.send("It doesn't appear that you own a cutlass.");
          hasCutlass.count -= 1;
          if (hasCutlass.count === 0) {
            userInv.splice(cutlassIndex, 1);
            user.stats.dexterity -= itemToEnchant.dexterity;
          }
          let falchion = items.find( (element) => element.itemID === 'falchionblade');
          let hasFalchion = userInv.find( ({itemID}) => itemID === 'falchionblade');
          if (hasFalchion) {
            hasFalchion.count += 1;
          } else {
            userInv.push({itemID: 'falchionblade', itemName: 'Falchion Blade', userID: user.userID, count: 1});
            user.stats.attack += falchion.attack;
            user.stats.dexterity += falchion.dexterity;
          }
          hasItem.count -= 1;
          if (hasItem.count === 0) {
            userInv.splice(itemIndex, 1);
          }
          user.commands += 10;
          await user.save().catch(err => console.log(err));
          await message.channel.send("You successfully turn your Cutlass into a Falchion Blade!");
        }
      } else if (hasItem.itemID === 'blackhole') {
        let amountToUse = args[1];
        if (amountToUse === 'max' || amountToUse === 'all') amountToUse = Number(hasItem.count);
        if (amountToUse !== 'max' && amountToUse !== 'all') amountToUse = Number(amountToUse);
        if (!amountToUse) amountToUse = 1;
        amountToUse = Math.floor(amountToUse);
        if (isNaN(amountToUse)) return message.channel.send('This is not a valid amount.');
        if (amountToUse > hasItem.count) return message.channel.send("You don't have that many.");
        if (amountToUse <= 0) return message.channel.send("Cmon bruh, really? Use 0? smh my head.");
        
        user.bankLimit += (amountToUse * Number(5000000));
        hasItem.count -= amountToUse;
        if (hasItem.count === 0) {
          userInv.splice(itemIndex, 1);
        }
        user.commands += 1;
        await user.save().catch(err => console.log(err));
        await message.channel.send(`You've unlocked ${amountToUse} Black Hole(s), increasing your bank space by **$${(amountToUse * 5000000).toLocaleString()}**! You now have **$${user.bankLimit.toLocaleString()}** in bank space!`).catch(err => console.log(err));
      } else if (hasItem.itemID === 'revenantsblood') {
        let amountToUse = args[1];
        if (amountToUse === 'max' || amountToUse === 'all') amountToUse = Number(hasItem.count);
        if (amountToUse !== 'max' && amountToUse !== 'all') amountToUse = Number(amountToUse);
        if (!amountToUse) amountToUse = 1;
        amountToUse = Math.floor(amountToUse);
        if (isNaN(amountToUse)) return message.channel.send('This is not a valid amount.');
        if (amountToUse > hasItem.count) return message.channel.send("You don't have that many.");
        if (amountToUse <= 0) return message.channel.send("Cmon bruh, really? Use 0? smh my head.");
        
        user.health += (amountToUse * Number(75));
        hasItem.count -= amountToUse;
        if (hasItem.count === 0) {
          userInv.splice(itemIndex, 1);
        }
        user.commands += 10;
        await user.save().catch(err => console.log(err));
        await message.channel.send(`You've consumed ${amountToUse} Vial(s) of Revenant's blood, increasing your health by **${(amountToUse * 75).toLocaleString()}**! You now have **${user.health.toLocaleString()}** total health!`).catch(err => console.log(err));
      } else if (hasItem.itemID === 'monarchscore') {
        let itemToEnchant = args[1];
        if (!itemToEnchant) return message.channel.send('Please provide a fang blade or fang piercer to enchant. `(p)use monarchscore <weapon>`');
        const itemResult = searcher.search(itemToEnchant);
        if (!itemResult[0]) return message.channel.send('Please provide a fang blade or fang piercer to enchant. `(p)use monarchscore <weapon>`');
        if (itemResult[0].type !== 'melee') return message.channel.send('Please provide a fang blade or fang piercer to enchant. `(p)use monarchscore <weapon>`');
        if (itemResult[0].itemID === 'fangpiercer') {
          let hasDagger = userInv.find( ({itemID}) => itemID === 'fangpiercer');
          let daggerIndex = userInv.indexOf(hasDagger);
          if (!hasDagger) return message.channel.send("It doesn't appear that you own a fang piercer.");
          hasDagger.count -= 1;
          if (hasDagger.count === 0) {
            userInv.splice(daggerIndex, 1);
            user.stats.attack -= itemToEnchant.attack;
          }
          let piercer = items.find( (element) => element.itemID === 'voidneedle');
          let hasPiercer = userInv.find( ({itemID}) => itemID === 'voidneedle');
          if (hasPiercer) {
            hasPiercer.count += 1;
          } else {
            userInv.push({itemID: 'voidneedle', itemName: 'Void Needle', userID: user.userID, count: 1});
            user.stats.attack += piercer.attack;
            user.stats.dexterity += piercer.dexterity;
          }
          hasItem.count -= 1;
          if (hasItem.count === 0) {
            userInv.splice(itemIndex, 1);
          }
          user.commands += 10;
          await user.save().catch(err => console.log(err));
          await message.channel.send("You successfully turn your Fang Piercer into a Void Needle!");
        } else if (itemResult[0].itemID === 'fangblade') {
          let hasSword = userInv.find( ({itemID}) => itemID === 'fangblade');
          let swordIndex = userInv.indexOf(hasSword);
          if (!hasSword) return message.channel.send("It doesn't appear that you own a fang blade.");
          hasSword.count -= 1;
          if (hasSword.count === 0) {
            userInv.splice(swordIndex, 1);
            user.stats.attack -= itemToEnchant.attack;
          }
          let blade = items.find( (element) => element.itemID === 'fangblade');
          let hasBlade = userInv.find( ({itemID}) => itemID === 'fangblade');
          if (hasBlade) {
            hasBlade.count += 1;
          } else {
            userInv.push({itemID: 'lungpiercer', itemName: 'Lung Piercer', userID: user.userID, count: 1});
            user.stats.attack += blade.attack;
            user.stats.dexterity += blade.dexterity;
          }
          hasItem.count -= 1;
          if (hasItem.count === 0) {
            userInv.splice(itemIndex, 1);
          }

          user.commands += 10;
          await user.save().catch(err => console.log(err));
          await message.channel.send("You successfully turn your Fang Blade into a Lung Piercer!");
        }
      } else if (hasItem.itemID === 'vileofvoid') {
        let amountToUse = 1;
        if (amountToUse > hasItem.count) return message.channel.send("You don't have that many.");
        let chance = Math.random();
        if (chance >= 0.25) {
          user.stats.attack += 1;
          user.stats.wisdom += 1;
          user.stats.dexterity += 1;
          await message.channel.send(`You've drank ${amountToUse} Vile of Void, increasing your attack, wisdom and dexterity by 1 each!`).catch(err => console.log(err));
        } else {
          user.health -= 25;
          await message.channel.send(`You've drank ${amountToUse} Vile of Void, decreasing your health by 25! Oh no!`).catch(err => console.log(err));
        }
        hasItem.count -= amountToUse;
        if (hasItem.count === 0) {
          userInv.splice(itemIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        
      }
    } 
  }
}