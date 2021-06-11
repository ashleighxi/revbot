const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class WhoisCommand extends BaseCommand {
  constructor() {
    super('whois', 'Moderation', ['wi']);
  }

  async run(client, message, args) {
    const mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!mentionedMember) return message.channel.send('I cannot find this member');

    let playing = ("[ " + mentionedMember.presence.activities + " ]");
    let status = mentionedMember.presence.activities[0];
    let statusName = '';
    if (!status) {
      statusName = 'None xD';
    } else {
      statusName = status.toString();
    }
    const whoEmbed = new Discord.MessageEmbed()
      .setTitle("**User Info**")
      .addField("Username:", `${mentionedMember.user.tag}`)
      .addField("ID:", mentionedMember.user.id)
      .addField("Playing:", playing)
      .addField("Status:", `${mentionedMember.presence.status}`)
      .addField("Custom status:",`${statusName}` )
      .addField("Joined Discord At:", mentionedMember.user.createdAt)
      .setColor("RANDOM")
      .setTimestamp()
      .setThumbnail(mentionedMember.user.avatarURL());

    try {
    await message.channel.send(whoEmbed);
    } catch(err) {
      console.log(err)
      message.channel.send('I was not able to send the message for this command.');
    }
  }
}