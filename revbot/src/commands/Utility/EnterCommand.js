const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const talkedRecently = new Set();
module.exports = class EnterCommand extends BaseCommand {
  constructor() {
    super('enter', 'Utility', []);
  }

  async run(client, message, args) {
    if(message.member.roles.cache.has(`796236163701932061`)) {
      console.log(`Yay, the author of the message has the role!`);
      if (message.channel.id !== '796236164150853659' && message.channel.id !== '798360718243397672') return message.channel.send("You cannot use that command in this channel.");
      if (talkedRecently.has(message.author.id)) {
        message.channel.send("Please wait 1 minute before typing this command again");

      } else {
        let user = message.author.id;
        const eventPingRole = message.guild.roles.cache.get(`798012491333369886`);
        message.delete({ timeout: 0 })
        .then(msg => console.log(`Deleted message from ${msg.author.username}`))
        .catch(console.error);
        const eventEmbed = new Discord.MessageEmbed()
          .setAuthor(`Event Manager Successfully Called`,`https://cdn.discordapp.com/emojis/796815507297796156.gif?v=1`)
          .setFooter(`Thanks for your patience!`)
          .setDescription(`\n**User:** <@!${user}>`)
          .setColor("#BE1100")
          .setTimestamp();
        try{
          await message.channel.send(`${eventPingRole}`, eventEmbed);
        } catch (err) {
          console.log(err);
          message.channel.send('I am not able to send that message.');
        }
        talkedRecently.add(message.author.id);
        setTimeout(() => {
          // Removes the user from the set after 1 minute
          talkedRecently.delete(message.author.id);
        }, 60000);
      }
    } else {
      console.log(`Nope, noppers, nadda.`);
      message.channel.send('You do not have the required role. <@?796236163701932061> Required.');
    }

  }
}
