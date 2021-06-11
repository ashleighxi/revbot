const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const statsDB = require('../../utils/models/botstats.js');
const talkedRecently = new Set();
module.exports = class GpingCommand extends BaseCommand {
  constructor() {
    super('gping', 'Utility', []);
  }

  async run(client, message, args) {
    
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (!guild.guildGiveawayManagerRole) return message.channel.send('You must set the giveaway manager role `//setgawmanager <role_id>`');
    const gawManagerRole = message.guild.roles.cache.get(guild.guildGiveawayManagerRole);
    const hasRole = message.member.roles.cache.has(`${gawManagerRole.id}`);
    if(hasRole) {
      console.log(`Yay, the author of the message has the role!`);
      if (talkedRecently.has(message.author.id)) {
        message.channel.send("Please wait 20 seconds before typing this command again");

      } else {
        let donation = args.join(" ").split(' ');
        let user = message.author.id;
        if (!guild.guildGiveawayPing) return message.channel.send('You must set the giveaway ping role `//setgawping <role_id>`');
        const giveawayPingRole = message.guild.roles.cache.get(guild.guildGiveawayPing) || await message.guild.roles.fetch(guild.guildGiveawayPing, true);
        console.log(`${donation}`);
        message.delete({ timeout: 0 })
        .then(msg => console.log(`Deleted message from ${msg.author.username}`))
        .catch(console.error);
        const donationEmbed = new Discord.MessageEmbed()
          .setThumbnail(`https://cdn.discordapp.com/emojis/796874020632920104.gif?v=1`)
          .setTitle(`Giveaway!`)
          .setFooter(`Don't forget to thank the sponsor!`)
          .setDescription(`**Sponsor:** ${donation[0]}\n**Message:** ${donation.slice(1).join(" ")}\n`)
          .setColor("#BE1100")
          .setTimestamp();
        try{
          await message.channel.send(`<@&${guild.guildGiveawayPing}>`, donationEmbed);
          let stats = await statsDB.findOne({});
          if (stats) {
            stats.giveawaysPinged += 1;
            await stats.save().catch(err => console.log(err));
          } else {
            let stats = new statsDB({
              giveawaysPinged: 1
            });
            await stats.save().catch(err => console.log(err));
          }
          
        } catch (err) {
          console.log(err);
          message.channel.send('I am not able to send that message.');
        }
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after 20 seconds
          talkedRecently.delete(message.author.id);
        }, 20000);
      }
    } else {
      console.log(`Nope, noppers, nadda.`);
      message.channel.send('You do not have the required role. Giveaway Manager Required.');
    }

  }
}
