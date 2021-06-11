const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const statsDB = require('../../utils/models/botstats.js');
module.exports = class DonateCommand extends BaseCommand {
  constructor() {
    super('donate', 'Utility', []);
  }

  async run(client, message, args) {
    let donation = args.join(" ").split('|');
    let user = message.author.id;
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (!guild.guildGiveawayManagerRole) return message.channel.send('You must set the giveaway manager role `//setgawmanager <role_id>`');
    const giveawayManagerRole = message.guild.roles.cache.get(guild.guildGiveawayManagerRole);
    console.log(`${donation}`);
    const donationEmbed = new Discord.MessageEmbed()
      .setThumbnail(`https://cdn.discordapp.com/emojis/796813658890043453.png?v=1`)
      .setTitle(`Giveaway Donation Request`)
      .setFooter(`Thanks for donating to ${guild.guildName}!`)
      .setDescription(`**Sponsor:** <@!${user}>\n**Timer:** ${donation[0]}\n**Winners:** ${donation[1]}\n**Requirements:** ${donation[2]}\n**Prize:** ${donation[3]}\n**Message:** ${donation[4]}`)
      .setColor("#BE1100")
      .setTimestamp();
    try{
      await message.channel.send(`${giveawayManagerRole}`, donationEmbed);
      let stats = await statsDB.findOne({});
      if (stats) {
        stats.giveawayDonations += 1;
        await stats.save().catch(err => console.log(err));
      } else {
        let stats = new statsDB({
          giveawayDonations: 1
        });
        await stats.save().catch(err => console.log(err));
      }
    } catch (err) {
      console.log(err);
      message.channel.send('I am not able to send that message.');
    }
  }
}
