const BaseCommand = require('../../utils/structures/BaseCommand');
const ms = require('ms');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class GendCommand extends BaseCommand {
  constructor() {
    super('gend', 'Giveaways', [], 'gend', 'End a giveaway.');
  }

  async run(client, message, args) {
    const guild = await guildDB.findOne({ guildID: message.guild.id });
    let giveawayManager = guild.guildGiveawayManagerRole;
    const roleCheck = message.member.roles.cache.has(giveawayManager);
    if(!message.member.hasPermission("ADMINISTRATOR") && !roleCheck) return message.channel.send("You do not have permission to create a giveaway. Requires `ADMINISTRATOR` or the giveaway manager role setup with `(p)setgawmanager`");
    let messageID = args[0];
    client.giveawaysManager.end(messageID).catch( (err) => {
      message.channel.send('No giveaway found for ' + messageID + ', check the ID and try again.');
    });
  }
}