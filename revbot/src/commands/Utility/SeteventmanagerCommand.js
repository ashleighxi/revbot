const BaseCommand = require('../../utils/structures/BaseCommand');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class SeteventmanagerCommand extends BaseCommand {
  constructor() {
    super('seteventmanager', 'Utility', []);
  }

  async run(client, message, args) {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to set the event manager role. Requires `ADMINISTRATOR`");
    let eventrole = args[0];
    if (!eventrole) return message.channel.send("You must provide the event manager role id `//seteventmanager <role_id>`");
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (guild) {
      guild.guildEventManagerRole = eventrole;
      await guild.save().catch(err => console.log(err));
      message.channel.send('Successfully set event manager role.');
    }
  }
}