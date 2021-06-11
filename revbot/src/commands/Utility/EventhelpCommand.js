const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class EventhelpCommand extends BaseCommand {
  constructor() {
    super('eventhelp', 'Utility', []);
  }

  async run(client, message, args) {
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    message.delete({ timeout: 500 })
    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
    .catch(console.error);
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`How to donate towards ${guild.guildName} Events`)
      .setFooter(`Thanks for your patience!`)
      .setDescription("**Use:** `//edonate (Event) | (prize) | (message)`\n\n**Example:** //edonate Mafia | 1mil | hi this is a message\n**Example:** //edonate Greentea | 1 Pepec | Good Luck!\n**Note:** Please use **|** to separate each category.\n**250k Minimum**")
      .setColor("#BE1100")
      .setTimestamp();
    try {
      await message.channel.send(helpEmbed);
    } catch (err) {
      console.log(err);
      message.channel.send('I am not able to send that message.');
    }
  }
}