const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const afkDB = require('../../utils/models/afk.js');

module.exports = class AfkCommand extends BaseCommand {
  constructor() {
    super('afk', 'Utility', []);
  }

  async run(client, message, args) {
    let reason = args.join(' ');
    const afkUser = await afkDB.findOne({ userID: message.author.id });
    if (afkUser) {
      if (reason === '' || reason === 'off') {
        await afkDB.findOneAndDelete({ userID: message.author.id });
        const welcomeBack = new Discord.MessageEmbed()
          .setAuthor(`Welcome back, ${message.author.username}`, message.author.displayAvatarURL())
          .setDescription("I've turned off your afk for now.")
          .setColor("RANDOM")
          .setFooter(":)")
          .setTimestamp();
        return message.channel.send(welcomeBack);
      } else {
        afkUser.reason = reason;
        await afkUser.save();
      }
    } else {
      let afkUser = new afkDB({
        userID: message.author.id,
        reason: reason
      });
      await afkUser.save();
    }
    const afkEmbed = new Discord.MessageEmbed()
      .setAuthor(`Cya later, ${message.author.username}!`, message.author.displayAvatarURL())
      .setDescription(`You are now AFK with reason: ${reason}`)
      .setColor('RANDOM')
      .setFooter(':)')
      .setTimestamp();

    return message.channel.send(afkEmbed);
    
    
  }
}