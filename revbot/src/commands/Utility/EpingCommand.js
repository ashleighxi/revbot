const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const talkedRecently = new Set();
module.exports = class EpingCommand extends BaseCommand {
  constructor() {
    super('eping', 'Utility', []);
  }

  async run(client, message, args) {
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    if (!guild.guildGiveawayManagerRole) return message.channel.send('You must set the event manager role `//seteventmanager <role_id>`');
    const eventManagerRole = message.guild.roles.cache.get(guild.guildEventManagerRole);
    const hasRole = message.member.roles.cache.has(`${eventManagerRole.id}`);
    if(hasRole) {
      console.log(`Yay, the author of the message has the role!`);
      if (talkedRecently.has(message.author.id)) {
        message.channel.send("Please wait 20 seconds before typing this command again");

      } else {
        let eventArgs = args.join(" ");
        let user = message.author.id;
        if (!guild.guildEventPing) return message.channel.send('You must set the event ping role `//seteventping <role_id>`');
        const eventPingRole = message.guild.roles.cache.get(guild.guildEventPing) || await message.guild.roles.fetch(guild.guildEventPing, true);
        console.log(`${eventArgs}`);
        message.delete({ timeout: 0 })
        .then(msg => console.log(`Deleted message from ${msg.author.username}`))
        .catch(console.error);
        const eventEmbed = new Discord.MessageEmbed()
          .setThumbnail(`https://cdn.discordapp.com/emojis/801367294315331614.gif?v=1`)
          .setTitle(`Event Time WOO!`)
          .setFooter(`The event will begin shortly!`)
          .setDescription(`**Event:** ${eventArgs}\n`)
          .setColor("#f1b4de")
          .setTimestamp();
        try{
          await message.channel.send(`${eventPingRole}`, eventEmbed);
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
      message.channel.send('You do not have the required role. Event Manager Required.');
    }
  }
}
