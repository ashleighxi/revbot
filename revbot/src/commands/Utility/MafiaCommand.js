const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const talkedRecently = new Set();
module.exports = class MafiaCommand extends BaseCommand {
  constructor() {
    super('mafia', 'Utility', []);
  }

  async run(client, message, args) {
    if(message.member.roles.cache.has(`798012491333369886`) || message.member.roles.cache.has(`811880007214694440`)) {
      console.log(`Yay, the author of the message has the role!`);
      if (talkedRecently.has(message.author.id)) {
        message.channel.send("Please wait 20 seconds before typing this command again");

      } else {
        let sponsor = message.mentions.members.first();
        let eventArgs = args.slice(1).join(" ");
        let user = message.author.id;
        const mafiaPingRole = message.guild.roles.cache.get(`813954957136232468`);
        console.log(`${eventArgs}`);
        message.delete({ timeout: 0 })
        .then(msg => console.log(`Deleted message from ${msg.author.username}`))
        .catch(console.error);
        const eventEmbed = new Discord.MessageEmbed()
          .setThumbnail(`https://images-ext-1.discordapp.net/external/K3O8UX0460iM6uT5BgbMlPwo7pWBweIO-TXDJ1VZJyg/https/pbs.twimg.com/media/DWVbyz5WsAA93-y.png?width=425&height=421`)
          .setTitle(`Mafia Time!`)
          .setFooter(`The event will begin shortly!`)
          .setDescription(`**Sponsor:** ${sponsor}\n**Message:** ${eventArgs}`)
          .setColor("#f1b4de")
          .setTimestamp();
        try{
          await message.channel.send(`${mafiaPingRole}`, eventEmbed);
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
      message.channel.send('You do not have the required role. Event Manager/Mafia Host Required.');
    }
  }
}