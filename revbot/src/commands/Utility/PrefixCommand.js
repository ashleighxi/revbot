const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class PrefixCommand extends BaseCommand {
  constructor() {
    super('prefix', 'Utility', ['setprefix']);
  }

  async run(client, message, args) {
    
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (args.length) {
      if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to change the prefix.");
      guild.guildPrefix = args[0];
      await guild.save().catch(err => console.log(err));
      return message.channel.send(`Successfully set prefix to \`${args[0]}\``);
    }

    return message.channel.send(`Prefix is \`${guild.guildPrefix || client.prefix}\``);
  }
}