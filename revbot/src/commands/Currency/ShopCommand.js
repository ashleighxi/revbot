const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const itemDB = require('../../utils/models/item.js');
let items;
module.exports = class ShopCommand extends BaseCommand {
  constructor() {
    super('shop', 'Currency', ['store'], 'shop', 'View the items in Rev\'s Den');
  }

  async run(client, message, args) {
    if(message.channel.type === "dm") return;
    items = await itemDB.find({ purchaseable: true });
    items.sort(function(a,b) {
      if (a.buyPrice < b.buyPrice) return -1;
      if (a.buyPrice > b.buyPrice) return 1;
      return 0;
    });
    let target = message.author;
    message.channel.send(generateEmbed(0)).then(msg => {
      if (items.length <= 4) return;

      msg.react('➡️')
      const filter = (reaction, user) => {
        return ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === target.id;
      }
      const collector = msg.createReactionCollector(filter, {time: 60000})
      console.log('got to collector');
      let currentIndex = 0;
      collector.on('collect', (reaction, user) => {
        console.log(`collected reaction ${reaction.emoji.name}`);
        msg.reactions.removeAll().then(async () => {
          reaction.emoji.name === '⬅️' ? currentIndex -= 4 : currentIndex += 4;
          await msg.edit(generateEmbed(currentIndex)).catch(err => console.log(err));
          if (currentIndex !== 0) await msg.react('⬅️');
          if (currentIndex + 4 < items.length) msg.react('➡️');
        })
      })
    })
  }
}

const generateEmbed = start => {
  const current = items.slice(start, start + 4);

  const storeEmbed = new Discord.MessageEmbed()
  .setTitle("Rev's Den")
  .setColor("RANDOM")
  .setTimestamp()
  current.forEach(item => storeEmbed.addField(`${item.icon} ${item.itemName} (\`${item.itemID}\`):`, `Price: $${Number(item.buyPrice).toLocaleString()}\nDescription: ${item.description}\nEffect: ${item.effect || 'none'}`))
  return storeEmbed;
}