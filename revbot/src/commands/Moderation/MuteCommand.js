const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class MuteCommand extends BaseCommand {
  constructor() {
    super('mute', 'Moderation', []);
  }

  async run(client, message, args) {
    if (!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send('You do not have permission to use this command.');
    if (!message.guild.me.hasPermission("MANAGE_ROLES")) return message.channel.send('I require \`MANAGE_ROLES\` permission to mute.');
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (!guild.guildMuteRole) return message.channel.send('You must set the mute role with `//setmuterole <role_id>`');
    const muteRole = message.guild.roles.cache.get(guild.guildMuteRole);
    const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    let reason = args.slice(1).join(" ");
    const muteEmbed = new Discord.MessageEmbed()
    .setTitle(`You have been muted in ${message.guild.name}`)
    .setDescription(`**Reason:** ${reason}\n**Moderator:** ${message.member.user.username}`)
    .setTimestamp()
    .setColor("#BE1100");

    if (!args[0]) return message.channel.send(`\`//mute <member> <reason>\``);
    if (!mentionedMember) return message.channel.send('The stated member is not in the server.');
    if (mentionedMember.user.id == message.author.id) return message.channel.send('You can\'t mute yourself dumbass.');
    if (mentionedMember.user.id == client.user.id) return message.channel.send('Honestly go fuck yourself.');
    if (!reason) reason = 'No reason given.';
    if (mentionedMember.roles.cache.has(muteRole.id)) return message.channel.send('This member is already muted');
    if (message.member.roles.highest.position <= mentionedMember.roles.highest.position) return message.channel.send('You cannot mute someone higher in the heiarchy than you.');

    await mentionedMember.send(muteEmbed).catch(err => console.log(err)).then(() => message.channel.send("Successfully muted " + mentionedMember.user.tag));
    await mentionedMember.roles.add(muteRole.id).catch(err => console.log(err).then(message.channel.send('There was an issue giving the mute role.')));
  }
}
