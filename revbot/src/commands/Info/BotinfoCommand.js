const { DiscordAPIError } = require('discord.js');
const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const humanizeDuration = require('humanize-duration');
module.exports = class BotinfoCommand extends BaseCommand {
  constructor() {
    super('botinfo', 'Info', []);
  }

  async run(client, message, args) {
    const botEmbed = new Discord.MessageEmbed()
      .setAuthor('revBot Stats', client.displayAvatarURL)
      .addField(`Total Servers: `, `\`${client.guilds.cache.size}\` servers`)
      .addField('Interacting with:', `\`${client.users.cache.size}\` users`)
      .addField('Uptime:', `\`${humanizeDuration(client.uptime, { round: true })}\``)
      .setFooter('pog')
      .setColor('RANDOM')
      .setTimestamp();
    await message.channel.send(botEmbed).catch(err => console.log(err));
  }
}