const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class EdonateCommand extends BaseCommand {
  constructor() {
    super('edonate', 'Utility', []);
  }

  async run(client, message, args) {
    let donation = args.join(" ").split('|');
    let user = message.author.id;
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (!guild.guildEventManagerRole) return message.channel.send('You must set the event manager role `//seteventmanager <role_id>`');
    const eventManagerRole = message.guild.roles.cache.get(guild.guildEventManagerRole);
    console.log(`${donation}`);
    const donationEmbed = new Discord.MessageEmbed()
      .setThumbnail(`https://cdn.discordapp.com/emojis/796813658890043453.png?v=1`)
      .setTitle(`Giveaway Donation Request`)
      .setFooter(`Thanks for donating to ${guild.guildName}!`)
      .setDescription(`**Sponsor:** <@!${user}>\n**Event:** ${donation[0]}\n**Prize:** ${donation[1]}\n**Message:** ${donation[2]}`)
      .setColor("#BE1100")
      .setTimestamp();
    try{
      await message.channel.send(`${eventManagerRole}`, donationEmbed);
    } catch (err) {
      console.log(err);
      message.channel.send('I am not able to send that message.');
    }
  }
}