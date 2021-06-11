const BaseCommand = require('../../utils/structures/BaseCommand');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class SetauctioneerCommand extends BaseCommand {
  constructor() {
    super('setauctioneer', 'Utility', []);
  }

  async run(client, message, args) {
    if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send("You do not have permission to set the auctioneer role. Requires `ADMINISTRATOR`");
    let arole = args[0];
    if (!arole) return message.channel.send("You must provide the auctioneer role id `//setauctioneer <role_id>`");
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (guild) {
      guild.guildAuctioneerRole = arole;
      await guild.save().catch(err => console.log(err));
      message.channel.send('Successfully set auctioneer role.');
    }
  }
}