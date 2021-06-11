const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const ms = require('ms');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class TempmuteCommand extends BaseCommand {
  constructor() {
    super('tempmute', 'Moderation', []);
  }

  async run(client, message, args) {
    if (!message.member.hasPermission("MUTE_MEMBERS")) return message.channel.send('You do not have permission to use this command.');
    if (!message.guild.me.hasPermission("MANAGE_ROLES")) return message.channel.send('I require \`MANAGE_ROLES\` permission to mute.');

    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (!guild.guildMuteRole) return message.channel.send('You must set the mute role with `//setmuterole <role_id>`');
    const muteRole = message.guild.roles.cache.get(guild.guildMuteRole);
    const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    let time = args[1];
    let reason = args.slice(2).join(" ");
    const muteEmbed = new Discord.MessageEmbed()
      .setTitle(`You have been muted in ${message.guild.name}`)
      .setDescription(`**Duration:** ${time}\n**Reason:** ${reason}\n**Moderator:** ${message.member.user.username}`)
      .setTimestamp()
      .setColor("#BE1100");

    if (!args[0]) return message.channel.send(`\`//tempmute <member> <time> <reason>\``);
    if (!mentionedMember) return message.channel.send('The stated member is not in the server.');
    if (mentionedMember.user.id == message.author.id) return message.channel.send('You can\'t mute yourself dumbass.');
    if (mentionedMember.user.id == client.user.id) return message.channel.send('Honestly go fuck yourself.');
    if (message.member.roles.highest.position <= mentionedMember.roles.highest.position) return message.channel.send('You cannot mute someone higher in the heiarchy than you.');
    if (!time) return message.channel.send(`You must state a duration of time \`//tempmute <member> <time> <reason>\``);
    if (!reason) reason = 'No reason given.';

    await mentionedMember.roles.add(muteRole.id).catch(err => console.log(err).then(message.channel.send('There was an issue giving the mute role.')));
    await mentionedMember.send(muteEmbed).catch(err => console.log(err)).then(() => message.channel.send("Successfully muted " + mentionedMember.user.tag));

    setTimeout(async function () {
      await mentionedMember.roles.remove(muteRole.id).catch(err => console.log(err).then(message.channel.send('There was an issue giving the mute role.')));
      await mentionedMember.send(`Your mute has been lifted in ${message.guild.name}.`).catch(err => console.log(err));
    }, ms(time));
  }
}
