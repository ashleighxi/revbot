const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class SetmuteroleCommand extends BaseCommand {
  constructor() {
    super('setmuterole', 'Moderation', []);
  }

  async run(client, message, args) {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to set the mute role. Requires `ADMINISTRATOR`");
    let muterole = args[0];
    if (!muterole) return message.channel.send("You must provide the mute role id `//setmuterole <role_id>`");
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (guild) {
      guild.guildMuteRole = muterole;
      await guild.save().catch(err => console.log(err));
      message.channel.send('Successfully set mute role.');
    }
  }
}