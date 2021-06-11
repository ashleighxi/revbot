const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');
const itemDB = require('../../utils/models/item.js');
let inv;
let items;
module.exports = class InventoryCommand extends BaseCommand {
  constructor() {
    super('inventory', 'Currency', ['inv'], 'inventory', 'View your revBot inventory');
  }

  async run(client, message, args) {
    let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (target) target = target.user;
    if (!target) target = message.author;
    let cDB = await curDB.findOne({ userID: target.id });
    items = await itemDB.find({});
    let inventory = '';
    inv = cDB.inventory;
    inv.sort(function(a,b) {
      if (a.itemID < b.itemID) return -1;
      if (a.itemID > b.itemID) return 1;
      return 0;
    });
    message.channel.send(generateEmbed(0)).then(msg => {
      if (inv.length <= 10) return;

      msg.react('➡️');
      const filter = (reaction, user) => {
        return ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === message.author.id;
      }
      const collector = msg.createReactionCollector(filter, { time: 60000 });
      console.log('collector');
      let currentIndex = 0;
      collector.on('collect', (reaction, user) => {
        msg.reactions.removeAll().then(async () => {
          reaction.emoji.name === '⬅️' ? currentIndex -= 10 : currentIndex += 10;
          await msg.edit(generateEmbed(currentIndex)).catch(err => console.log(err));
          if (currentIndex !== 0) await msg.react('⬅️');
          if (currentIndex + 6 < inv.length) msg.react('➡️');
        })
      })
    })
    // invDB.forEach(element => {
    //   let item = iDB.find(({ itemID }) => itemID === element.itemID);
    //   if (item) {
    //     inventory += `${item.icon} ${element.itemName}: ${element.count}\n`;
    //   }
    // });
    // const invEmbed = new Discord.MessageEmbed()
    //   .setTitle(`**${target.username}'s Inventory**`)
    //   .setDescription(inventory)
    //   .setFooter('Not bad... Good size...')
    //   .setTimestamp();
    // await message.channel.send(invEmbed).catch(err => console.log(err));
  }
}
const generateEmbed = start => {
  const current = inv.slice(start, start + 10);

  const invEmbed = new Discord.MessageEmbed()
  .setTitle("Inventory")
  .setColor("RANDOM")
  .setFooter('(p)item <itemID> for details.')
  .setTimestamp()
  current.forEach(item => {
    let i = items.find(({ itemID }) => itemID === item.itemID);
    invEmbed.addField(`${i.icon} ${item.itemName}  -  ${item.count}`, `ID \`${item.itemID}\``)
  });
  return invEmbed;
}