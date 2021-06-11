const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class UnbanCommand extends BaseCommand {
  constructor() {
    super('unban', 'Moderation', []);
  }

  async run(client, message, args) {
    //Permission Checking:
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You do not have permission to unban someone.");
    if(!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send("My role does not have the unban permission.");

    //Variables:
    let reason = args.slice(1).join(" ");
    if (!reason) reason = 'None given';
    const userID = args[0];
    //Input Checking:
    if (!args[0]) return message.channel.send('You must give a revived soul to unban. `//unban ID reason`');
    if (!mentionedMember) return message.channel.send("The member mentioned is not here idiot.");
    if (isNaN(args[0])) return message.channel.send('The ID stated is not a number. `//unban ID reason`');

    //Executing:
    message.guild.fetchBans().then(async bans => {
      if (bans.size == 0) return message.channel.send('This server has noone banned.');
      let bUser = bans.find(b => b.user.id == userID);
      if (!bUser) return message.channel.send('The user ID stated is not banned.');
      await message.guild.members.unban(bUser.user, reason).catch(err => {
        console.log(err);
        return message.channel.send('Something went wrong while unbanning the ID');
      }).then(() => {
        message.channel.send(`Successfully unbanned ${mentionedMember.user.tag}`);
      });
    });


  }
}
