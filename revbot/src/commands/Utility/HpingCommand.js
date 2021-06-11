const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const statsDB = require('../../utils/models/botstats.js');
const talkedRecently = new Set();

module.exports = class HpingCommand extends BaseCommand {
  constructor() {
    super('hping', 'Utility', []);
  }

  async run(client, message, args) {
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (!guild.guildHeistManagerRole) return message.channel.send('You must set the heist manager role `//setheistmanager <role_id>`');
    const heistManagerRole = message.guild.roles.cache.get(guild.guildHeistManagerRole);
    const hasRole = message.member.roles.cache.has(`${heistManagerRole.id}`);
    console.log(hasRole);
    if(hasRole) {
      if (talkedRecently.has(message.author.id)) {
        message.channel.send("Please wait 20 seconds before typing this command again");

      } else {
        let donation = args.join(" ").split(' ');
        let user = message.author.id;
        if (!guild.guildHeistPing) return message.channel.send('You must set the heist ping role `//setheistping <role_id>`');
        const heistPingRole = message.guild.roles.cache.get(guild.guildHeistPing);
        let roleCollection = message.guild.roles.cache.each(role => console.log(role.id));
        var roleID;
        for (const [key, value] of roleCollection){
          let lowerRoleName = value.name.toLowerCase();
          if (lowerRoleName.includes(donation[2])) {
            roleID = key;
            console.log(key, value.name);
          }
        }
        console.log(`${donation}`);
        message.delete({ timeout: 0 })
        .then(msg => console.log(`Deleted message from ${msg.author.username}`))
        .catch(console.error);
        const donationEmbed = new Discord.MessageEmbed()
          .setThumbnail(`https://cdn.discordapp.com/emojis/796815550739120178.gif?v=1`)
          .setTitle(`${guild.guildName} Heist Event!`)
          .setFooter(`Don't forget to thank the sponsor!`)
          .setDescription(`**Sponsor:** ${donation[0]}\n**Amount:** ${donation[1]}\n**Requirements:** <@&${roleID}>`)
          .setColor("#BE1100")
          .setTimestamp();
        try{
          await message.channel.send(`${heistPingRole}`, donationEmbed);
          let stats = await statsDB.findOne({});
          if (stats) {
            stats.heistsPinged += 1;
            await stats.save().catch(err => console.log(err));
          } else {
            let stats = new statsDB({
              heistsPinged: 1
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
      message.channel.send('You do not have the required role. Heist Manager Required.');
    }
  }
}
