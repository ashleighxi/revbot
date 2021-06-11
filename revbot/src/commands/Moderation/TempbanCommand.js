const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const ms = require('ms');

module.exports = class TempbanCommand extends BaseCommand {
  constructor() {
    super('tempban', 'Moderation', []);
  }

  async run(client, message, args) {
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You do not have permission to ban someone.");
    if(!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send("My role does not have the \`BAN_MEMBERS\` permission.");

    const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    let reason = args.slice(2).join(" ");
    let time = args[1];
    const banEmbed = new Discord.MessageEmbed()
      .setTitle(`You have been temporarily banned from ${message.guild.name}`)
      .setDescription(`**Duration:** ${time}\n**Reason:** ${reason}\n**Moderator:** ${message.member.user.username}\n*If you think this is a mistake appeal here:* https://docs.google.com/forms/d/e/1FAIpQLSc78AvsDLDusX5ccPxjgGTZ4Hr9O92cmSlEI-VMIB2QB91PlQ/viewform`)
      .setTimestamp()
      .setColor("#BE1100");

    if (!args[0]) return message.channel.send(`\`//tempban <member> <time> <reason>\``);
    if (mentionedMember.user.id == message.author.id) return message.channel.send('You can\'t ban yourself dumbass. (like Harry did xD)');
    if (mentionedMember.user.id == client.user.id) return message.channel.send('smh my head. you really tryna get smacked the fuck up, huh?');
    if (!mentionedMember.bannable) return message.channel.send('I cannot ban that member.');
    if (message.member.roles.highest.position <= mentionedMember.roles.highest.position) return message.channel.send('You cannot ban someone higher in the heiarchy than you.');
    if (!reason) reason = 'None given';
    if (!time) return message.channel.send(`You must state a duration of time \`//tempban <member> <time> <reason>\``);

    await mentionedMember.send(banEmbed).catch(err => console.log(err));
    await mentionedMember.ban({
        days: 0,
        reason: reason
    }).catch(err => console.error(err)).then(() => message.channel.send("Successfully banned " + mentionedMember.user.tag));

    setTimeout(async function () {
      await message.guild.fetchBans().then(async bans => {
        if (bans.size == 0) return message.channel.send('This server has noone banned.');
        let bUser = bans.find(b => b.user.id == mentionedMember);
        if (!bUser) return console.log('Member unbanned');
        await message.guild.members.unban(bUser.user, reason).catch(err => {
          console.log(err);
          return message.channel.send('Something went wrong while unbanning the ID');
        }).then(() => {
          console.log('Member unbanned');
        });
      });
    }, ms(time));
  }
}
