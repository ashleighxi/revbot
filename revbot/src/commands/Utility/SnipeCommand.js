const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const ms = 
module.exports = class SnipeCommand extends BaseCommand {
  constructor() {
    super('snipe', 'Utility', []);
  }

  async run(client, message, args) {
    const msg = client.snipes.get(message.channel.id);
    if (!msg) return message.channel.send('There is nothing to snipe :joy:');

    const snipeEmbed = new Discord.MessageEmbed()
      .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
      .setDescription(msg.content)
      .setTimestamp();
    
    message.channel.send(snipeEmbed);
    setTimeout(() => {
      client.snipes.delete(message.channel.id);
    }, 10000);
  }
}