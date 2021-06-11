const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class SayCommand extends BaseCommand {
  constructor() {
    super('say', 'fun', []);
  }

  async run(client, message, args) {
    if (message.member.hasPermission("MANAGE_MESSAGES") || message.member.roles.cache.has('798697724525543445')) {
      if (message.mentions.channels.size > 0) {
        let sayMessage = args.slice(1).join(" ");
        if (sayMessage.includes('@everyone') || sayMessage.includes('@here')) return message.channel.send("Don't be a dumbass please.");
        message.mentions.channels.first().send(sayMessage);
      } else {
        let sayMessage = args.join(" ");
        if (sayMessage.includes('@everyone') || sayMessage.includes('@here')) return message.channel.send("Don't be a dumbass please.");
        message.channel.send(sayMessage);
      }
    } else {
      return message.channel.send('You must be level 60 or have `MANAGE_MESSAGES` to use this command.');
    }
    
    
  }
}