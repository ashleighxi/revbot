const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
const humanizeDuration = require('humanize-duration');
const FuzzySearch = require('fuzzy-search');
module.exports = class CraftCommand extends BaseCommand {
  constructor() {
    super('craft', 'Currency', [], 'craft', 'Craft powerful items to use in revBot Dungeons.');
  }

  async run(client, message, args) {
    let target = message.author;
    let cooldown = 3000;
    let item = args[0];
    if (item === 'list' || item === undefined) {
      const craftEmbed = new Discord.MessageEmbed()
      .setAuthor('Crafting Recipes', target.displayAvatarURL())
      .setDescription('You must have all of the ingredients in your inventory, then type `(p)craft <item>`.')
      .addField("Wizard's Robe", '305 Torn Rags, 64 Void Essence, 2 Silk Glands.')
      .addField("Void Wand", '40 core wood, 108 Void Essence.')
      .addField("Volatile Amulet", '1 Jewel Necklace, 64 Mosquito Wings, 1 Vial of X.')
      .addField("Rogue's Cloak", '305 Torn Rags, 1 Silk Gland, 2 Vial of X.')
      .addField("Ethereal Amulet", '1 Jewel Necklace, 64 Ethereal Dust, 1 Silk Gland')
      .addField("Revival Pauldrons", '64 Armor Scraps, 108 Ethereal Dust, 8 Void Essence')
      .addField("Omniscient Orb", '32 Pure Void, 64 Ethereal Dust, 1 Vial of X')
      .addField("Blade Poison", '1 Vial of X, 32 Pure Void, 64 Void Essence')
      .setColor("RANDOM")
      .setFooter('🛠️')
      return message.channel.send(craftEmbed);
    }
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
      if (!isItem.craftable) return message.channel.send("This item cannot be crafted");
      let itemIndex = userInv.indexOf(hasItem);
      if (result[0].itemID === 'wizardsrobe') {
        let tornRags = userInv.find( (element) => element.itemID === 'tornrags');
        let voidEssence = userInv.find( (element) => element.itemID === 'voidessence');
        let silkGlands = userInv.find( (element) => element.itemID === 'silkgland');
        let tornRagsIndex = userInv.indexOf(tornRags);
        let voidEssenceIndex = userInv.indexOf(voidEssence);
        let silkGlandsIndex = userInv.indexOf(silkGlands);
        if (tornRags.count < 305 || voidEssence.count < 64 || silkGlands.count < 2 || !tornRags || !voidEssence || !silkGlands) return message.channel.send('You do not have the required items to craft that. See the recipe in `(p)craft list`');
        if (hasItem) {
          hasItem.count += 1;
        } else {
          userInv.push({ itemID: isItem.itemID, itemName: isItem.itemName, userID: target.id, count: 1 });
          user.stats.wisdom += isItem.wisdom;
          user.health += 25;
        }
        tornRags.count -= 305;
        voidEssence.count -= 64;
        silkGlands.count -= 2;
        if (tornRags.count === 0) {
          userInv.splice(tornRagsIndex, 1);
        }
        if (voidEssence.count === 0) {
          userInv.splice(voidEssenceIndex, 1);
        }
        if (silkGlands.count === 0) {
          userInv.splice(silkGlandsIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        return message.channel.send('You successfully craft the **Wizard\'s Robe**!');
      } else if (result[0].itemID === 'voidwand') {
        let coreWood = userInv.find( (element) => element.itemID === 'corewood');
        let voidEssence = userInv.find( (element) => element.itemID === 'voidessence');
        let coreWoodIndex = userInv.indexOf(coreWood);
        let voidEssenceIndex = userInv.indexOf(voidEssence);
        if (coreWood.count < 40 || voidEssence.count < 64|| !coreWood || !voidEssence) return message.channel.send('You do not have the required items to craft that. See the recipe in `(p)craft list`');
        if (hasItem) {
          hasItem.count += 1;
        } else {
          userInv.push({ itemID: isItem.itemID, itemName: isItem.itemName, userID: target.id, count: 1 });
          user.stats.wisdom += isItem.wisdom;
        }
        coreWood.count -= 40;
        voidEssence.count -= 64;
        if (coreWood.count === 0) {
          userInv.splice(coreWoodIndex, 1);
        }
        if (voidEssence.count === 0) {
          userInv.splice(voidEssenceIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        return message.channel.send('You successfully craft a **Void Wand**!');
      } else if (result[0].itemID === 'volatileamulet') {
        let jewelNecklace = userInv.find( (element) => element.itemID === 'jewelnecklace');
        let mosquitoWings = userInv.find( (element) => element.itemID === 'mosquitowings');
        let vialOfX = userInv.find( (element) => element.itemID === 'vialofx');
        let jewelNecklaceIndex = userInv.indexOf(jewelNecklace);
        let mosquitoWingsIndex = userInv.indexOf(mosquitoWings);
        let vialOfXIndex = userInv.indexOf(vialOfX);
        if (jewelNecklace.count < 1 || mosquitoWings.count < 64 || vialOfX.count < 1 || !jewelNecklace || !mosquitoWings || !vialOfX) return message.channel.send('You do not have the required items to craft that. See the recipe in `(p)craft list`');
        if (hasItem) {
          hasItem.count += 1;
        } else {
          userInv.push({ itemID: isItem.itemID, itemName: isItem.itemName, userID: target.id, count: 1 });
          user.stats.wisdom += isItem.wisdom;
          user.stats.attack += isItem.attack;
          user.stats.dexterity += isItem.dexterity;
        }
        jewelNecklace.count -= 1;
        mosquitoWings.count -= 64;
        vialOfX.count -= 1;
        if (jewelNecklace.count === 0) {
          userInv.splice(jewelNecklaceIndex, 1);
        }
        if (mosquitoWings.count === 0) {
          userInv.splice(mosquitoWingsIndex, 1);
        }
        if (vialOfX.count === 0) {
          userInv.splice(vialOfXIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        return message.channel.send('You successfully craft a **Volatile Amulet**!');
      } else if (result[0].itemID === 'roguescloak') {
        let tornRags = userInv.find( (element) => element.itemID === 'tornrags');
        let vialOfX = userInv.find( (element) => element.itemID === 'vialofx');
        let silkGlands = userInv.find( (element) => element.itemID === 'silkgland');
        let tornRagsIndex = userInv.indexOf(tornRags);
        let vialOfXIndex = userInv.indexOf(vialOfX);
        let silkGlandsIndex = userInv.indexOf(silkGlands);
        if (tornRags.count < 305 || vialOfX.count < 2 || silkGlands.count < 1 || !tornRags || !vialOfX || !silkGlands) return message.channel.send('You do not have the required items to craft that. See the recipe in `(p)craft list`');
        if (hasItem) {
          hasItem.count += 1;
        } else {
          userInv.push({ itemID: isItem.itemID, itemName: isItem.itemName, userID: target.id, count: 1 });
          user.stats.dexterity += isItem.dexterity;
          user.health += 25;
        }
        tornRags.count -= 305;
        vialOfX.count -= 2;
        silkGlands.count -= 1;
        if (tornRags.count === 0) {
          userInv.splice(tornRagsIndex, 1);
        }
        if (vialOfX.count === 0) {
          userInv.splice(vialOfXIndex, 1);
        }
        if (silkGlands.count === 0) {
          userInv.splice(silkGlandsIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        return message.channel.send('You successfully craft the **Rogue\'s Cloak**!');
      } else if (result[0].itemID === 'etherealamulet') {
        //1 Jewel Necklace, 64 Ethereal Dust, 1 Silk Gland
        let jewelNecklace = userInv.find( (element) => element.itemID === 'jewelnecklace');
        let etherealDust = userInv.find( (element) => element.itemID === 'etherealdust');
        let silkGland = userInv.find( (element) => element.itemID === 'silkgland');
        let jewelNecklaceIndex = userInv.indexOf(jewelNecklace);
        let etherealDustIndex = userInv.indexOf(etherealDust);
        let silkGlandIndex = userInv.indexOf(silkGland);
        if (jewelNecklace.count < 1 || etherealDust.count < 64 || silkGland.count < 1 || !jewelNecklace || !etherealDust || !silkGland) return message.channel.send('You do not have the required items to craft that. See the recipe in `(p)craft list`');
        if (hasItem) {
          hasItem.count += 1;
        } else {
          userInv.push({ itemID: isItem.itemID, itemName: isItem.itemName, userID: target.id, count: 1 });
          user.stats.wisdom += isItem.wisdom;
          user.stats.attack += isItem.attack;
          user.stats.dexterity += isItem.dexterity;
        }
        jewelNecklace.count -= 1;
        etherealDust.count -= 64;
        silkGland.count -= 1;
        if (jewelNecklace.count === 0) {
          userInv.splice(jewelNecklaceIndex, 1);
        }
        if (etherealDust.count === 0) {
          userInv.splice(etherealDustIndex, 1);
        }
        if (silkGland.count === 0) {
          userInv.splice(silkGlandIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        return message.channel.send('You successfully craft an **Ethereal Amulet**!');
      } else if (result[0].itemID === 'revivalpauldrons') {
        //.addField("Revival Pauldrons", '64 Armor Scraps, 108 Ethereal Dust, 8 Void Essence')
        let armorScraps = userInv.find( (element) => element.itemID === 'armorscraps');
        let etherealDust = userInv.find( (element) => element.itemID === 'etherealdust');
        let voidEssence = userInv.find( (element) => element.itemID === 'voidessence');
        let armorScrapsIndex = userInv.indexOf(armorScraps);
        let etherealDustIndex = userInv.indexOf(etherealDust);
        let voidEssenceIndex = userInv.indexOf(voidEssence);
        if (armorScraps.count < 64 || etherealDust.count < 108 || voidEssence.count < 8 || !armorScraps || !etherealDust || !voidEssence) return message.channel.send('You do not have the required items to craft that. See the recipe in `(p)craft list`');
        if (hasItem) {
          hasItem.count += 1;
        } else {
          userInv.push({ itemID: isItem.itemID, itemName: isItem.itemName, userID: target.id, count: 1 });
          user.stats.attack += isItem.attack;
          user.health += 75;
        }
        armorScraps.count -= 64;
        etherealDust.count -= 108;
        voidEssence.count -= 8;
        if (armorScraps.count === 0) {
          userInv.splice(armorScrapsIndex, 1);
        }
        if (etherealDust.count === 0) {
          userInv.splice(etherealDustIndex, 1);
        }
        if (voidEssence.count === 0) {
          userInv.splice(voidEssenceIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        return message.channel.send('You successfully craft the **Revival Pauldrons**!');
      } else if (result[0].itemID === 'omniscientorb') {
        //.addField("Omniscient Orb", '32 Pure Void, 64 Ethereal Dust, 1 Vial of X')
        let pureVoid = userInv.find( (element) => element.itemID === 'purevoid');
        let etherealDust = userInv.find( (element) => element.itemID === 'etherealdust');
        let vialOfX = userInv.find( (element) => element.itemID === 'vialofx');
        let pureVoidIndex = userInv.indexOf(pureVoid);
        let etherealDustIndex = userInv.indexOf(etherealDust);
        let vialOfXIndex = userInv.indexOf(vialOfX);
        if (pureVoid.count < 32 || etherealDust.count < 64 || vialOfX.count < 1 || !pureVoid || !etherealDust || !vialOfX) return message.channel.send('You do not have the required items to craft that. See the recipe in `(p)craft list`');
        if (hasItem) {
          hasItem.count += 1;
        } else {
          userInv.push({ itemID: isItem.itemID, itemName: isItem.itemName, userID: target.id, count: 1 });
          user.stats.wisdom += isItem.wisdom;
        }
        pureVoid.count -= 32;
        etherealDust.count -= 64;
        vialOfX.count -= 1;
        if (pureVoid.count === 0) {
          userInv.splice(pureVoidIndex, 1);
        }
        if (etherealDust.count === 0) {
          userInv.splice(etherealDustIndex, 1);
        }
        if (vialOfX.count === 0) {
          userInv.splice(vialOfXIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        return message.channel.send('You successfully craft an **Omniscient Orb**!');
      } else if (result[0].itemID === 'bladepoison') {
        //.addField("Blade Poison", '1 Vial of X, 32 Pure Void, 64 Void Essence')
        let pureVoid = userInv.find( (element) => element.itemID === 'purevoid');
        let voidEssence = userInv.find( (element) => element.itemID === 'voidessence');
        let vialOfX = userInv.find( (element) => element.itemID === 'vialofx');
        let pureVoidIndex = userInv.indexOf(pureVoid);
        let voidEssenceIndex = userInv.indexOf(voidEssence);
        let vialOfXIndex = userInv.indexOf(vialOfX);
        if (pureVoid.count < 32 || voidEssence.count < 64 || vialOfX.count < 1 || !pureVoid || !voidEssence || !vialOfX) return message.channel.send('You do not have the required items to craft that. See the recipe in `(p)craft list`');
        if (hasItem) {
          hasItem.count += 1;
        } else {
          userInv.push({ itemID: isItem.itemID, itemName: isItem.itemName, userID: target.id, count: 1 });
          user.stats.dexterity += isItem.dexterity;
        }
        pureVoid.count -= 32;
        voidEssence.count -= 64;
        vialOfX.count -= 1;
        if (pureVoid.count === 0) {
          userInv.splice(pureVoidIndex, 1);
        }
        if (voidEssence.count === 0) {
          userInv.splice(voidEssenceIndex, 1);
        }
        if (vialOfX.count === 0) {
          userInv.splice(vialOfXIndex, 1);
        }
        user.commands += 25;
        await user.save().catch(err => console.log(err));
        return message.channel.send('You successfully craft some **Blade Poison**!');
      }
    }
  }
}