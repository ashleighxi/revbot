const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const statsDB = require('../../utils/models/botstats.js');
module.exports = class HdonateCommand extends BaseCommand {
  constructor() {
    super('hdonate', 'Utility', []);
  }

  async run(client, message, args) {
    
    let donation = args.join(" ").split('|');
    let user = message.author.id;
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (!guild.guildHeistManagerRole) return message.channel.send('You must set the heist manager role `//setheistmanager <role_id>`');
    const heistManagerRole = message.guild.roles.cache.get(guild.guildHeistManagerRole);
    console.log(`${donation}`);
    const donationEmbed = new Discord.MessageEmbed()
      .setThumbnail(`https://cdn.discordapp.com/emojis/796813658890043453.png?v=1`)
      .setTitle(`Heist Donation Request`)
      .setFooter(`Thanks for donating to ${guild.guildName}!`)
      .setDescription(`**Sponsor:** <@!${user}>\n**Requirements:** ${donation[0]}\n**Amount:** ${donation[1]}`)
      .setColor("#BE1100")
      .setTimestamp();
    try{
      await message.channel.send(`${heistManagerRole}`, donationEmbed);
      let stats = await statsDB.findOne({});
      if (stats) {
        stats.heistDonations += 1;
        await stats.save().catch(err => console.log(err));
      } else {
        let stats = new statsDB({
          heistDonations: 1
        });
        await stats.save().catch(err => console.log(err));
      }
    } catch (err) {
      console.log(err);
      message.channel.send('I am not able to send that message.');
    }
  }
}
