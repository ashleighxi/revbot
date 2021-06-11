const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class SetheistpingCommand extends BaseCommand {
  constructor() {
    super('setheistping', 'Utility', []);
  }

  async run(client, message, args) {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to set the mute role. Requires `ADMINISTRATOR`");
    let heistping = args[0];
    if (!heistping) return message.channel.send("You must provide the heist manager role id `//setheistping <role_id>`");
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (guild) {
      guild.guildHeistPing = heistping;
      await guild.save().catch(err => console.log(err));
      message.channel.send('Successfully set heist ping role.');
    }
  }
}