const BaseCommand = require('../../utils/structures/BaseCommand');
const ms = require('ms');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class GrerollCommand extends BaseCommand {
  constructor() {
    super('greroll', 'Giveaways', [], 'greroll', 'Reroll a giveaway.');
  }

  async run(client, message, args) {
    const guild = await guildDB.findOne({ guildID: message.guild.id });
    let giveawayManager = guild.guildGiveawayManagerRole;
    const roleCheck = message.member.roles.cache.has(giveawayManager);
    if(!message.member.hasPermission("ADMINISTRATOR") && !roleCheck) return message.channel.send("You do not have permission to create a giveaway. Requires `ADMINISTRATOR` or the giveaway manager role setup with `(p)setgawmanager`");
    let messageID = args[0];
    client.giveawaysManager.reroll(messageID, {
      messages: {
        congrat: ':tada: New winner(s) : {winners}! Congratulations!\n{messageURL}',
        error: 'No valid participations, no winners can be chosen!'
      }
    }).catch( (err) => {
      message.channel.send('No giveaway found for ' + messageID + ', check the ID and try again.');
    });
  }
}