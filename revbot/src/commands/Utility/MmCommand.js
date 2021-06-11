const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class MmCommand extends BaseCommand {
  constructor() {
    super('mm', 'Utility', []);
  }

  async run(client, message, args) {
    if(message.member.roles.cache.has(`796236163701932061`)) {
      console.log(`Yay, the author of the message has the role!`);

      let user = message.author.id;
      const mmPingRole = message.guild.roles.cache.get(`796236163710058542`);
      message.delete({ timeout: 0 })
      .then(msg => console.log(`Deleted message from ${msg.author.username}`))
      .catch(console.error);
      const middlemanEmbed = new Discord.MessageEmbed()
        .setAuthor(`Middle Person Successfully Called`,`https://cdn.discordapp.com/emojis/796815507297796156.gif?v=1`)
        .setFooter(`Thanks for your patience!`)
        .setDescription(`\n**User:** <@!${user}>`)
        .setColor("#BE1100")
        .setTimestamp();
      try{
        await message.channel.send(`${mmPingRole}`, middlemanEmbed);
      } catch (err) {
        console.log(err);
        message.channel.send('I am not able to send that message.');
      }
    } else {
      console.log(`Nope, noppers, nadda.`);
      message.channel.send('You do not have the required role. <@?796236163701932061> Required.');
    }

  }
}
