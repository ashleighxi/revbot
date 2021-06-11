const BaseCommand = require('../../utils/structures/BaseCommand');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class SeteventpingCommand extends BaseCommand {
  constructor() {
    super('seteventping', 'Utility', []);
  }

  async run(client, message, args) {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to set the mute role. Requires `ADMINISTRATOR`");
    let eventrole = args[0];
    if (!eventrole) return message.channel.send("You must provide the event ping role id `//seteventping <role_id>`");
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (guild) {
      guild.guildEventPing = eventrole;
      await guild.save().catch(err => console.log(err));
      message.channel.send('Successfully set event ping role.');
    }
  }
}