const BaseCommand = require('../../utils/structures/BaseCommand');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class SetgawmanagerCommand extends BaseCommand {
  constructor() {
    super('setgawmanager', 'Utility', []);
  }

  async run(client, message, args) {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to set the mute role. Requires `ADMINISTRATOR`");
    let gawrole = args[0];
    if (!gawrole) return message.channel.send("You must provide the giveaway manager role id `//setgawmanager <role_id>`");
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (guild) {
      guild.guildGiveawayManagerRole = gawrole;
      await guild.save().catch(err => console.log(err));
      message.channel.send('Successfully set giveaway manager role.');
    }
  }
}