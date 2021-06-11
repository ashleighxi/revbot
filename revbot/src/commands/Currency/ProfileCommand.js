const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const userDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
module.exports = class ProfileCommand extends BaseCommand {
  constructor() {
    super('profile', 'Currency', ['level'], 'profile', 'View your revBot profile.');
  }

  async run(client, message, args) {
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (target) target = target.user;
    if (!target) target = message.author;

    let user = await userDB.findOne({ userID: target.id });
    let items = await itemDB.find({});
    if (user) {
      if (user.stats === undefined) {
        user.stats = {attack: 1, wisdom: 1, dexterity: 1, experience: 0};
      }
      let username = target.username;
      let pfp = target.displayAvatarURL();
      let points = Number(user.balance);
      let wallet = Number(user.wallet);
      let bank = Number(user.bank);
      let experience = Number(user.commands);
      let level = Math.floor(Number(experience) / 100);
      let commands = Number(user.commands);
      let userClass = user.class;
      let inventory = user.inventory;
      let health = user.health;
      let invValue = 0;
      let attack = 1;
      let wisdom = 1;
      let dexterity = 1;
      
      inventory.forEach(async function (element) {
          let item = items.find((x) => x.itemID === element.itemID);
          if (item.buyPrice) {
            invValue += item.buyPrice * element.count;
          } else if (item.itemPrice) {
            invValue += item.itemPrice * element.count;
          }
          if (item.attack)
            attack += Number(item.attack);
          if (item.wisdom)
            wisdom += Number(item.wisdom);
          if (item.dexterity)
            dexterity += Number(item.dexterity);
      });
      user.stats = {attack: attack, wisdom: wisdom, dexterity: dexterity, experience: experience};
      console.log(user.stats);
      await user.save().catch(err => console.log(err));
      const profileEmbed = new Discord.MessageEmbed()
      .setAuthor(`${username}'s profile`, pfp)
      .addField('Level:', `\`${level}\``, true)
      .addField('Experience:', `\`${experience}/${(level * 100) + 100}\``, true)
      .addField('Character:', `Class: \`${userClass}\``, true)
      .addField('Stats:', `Health: \`${health + Math.floor(0.5 * level)}\`\nAttack: \`${attack}\`\nWisdom: \`${wisdom}\`\nDexterity: \`${dexterity}\``, true)
      .addField('Currency:', `Wallet: \`$${wallet.toLocaleString()}\`\nBank: \`$${bank.toLocaleString()}\`\nInventory: \`$${invValue.toLocaleString()}\`\nPoints: \`${points}\``, true)
      .setFooter('Thanks for using my bot :) - rev')
      .setTimestamp()
      .setColor("RANDOM");
      await message.channel.send(profileEmbed).catch(err => console.log(err));
      
      
    }
  }
}