const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class HpingCommand extends BaseCommand {
  constructor() {
    super('hping', 'Utility', []);
  }

  async run(client, message, args) {
    if(message.member.roles.cache.has(`796953585295294514`)) {
      let donation = args.join(" ").split(' ');
      let user = message.author.id;
      const heistPingRole = message.guild.roles.cache.get(`796277181277011978`);
      let reqRole = message.guild.roles.cache.find(role => role.name === donation[2]);
      console.log(`${donation}`);
      console.log(`${reqRole}`);
      message.delete({ timeout: 0 })
      .then(msg => console.log(`Deleted message from ${msg.author.username}`))
      .catch(console.error);
      const donationEmbed = new Discord.MessageEmbed()
        .setThumbnail(`https://cdn.discordapp.com/emojis/796815550739120178.gif?v=1`)
        .setTitle(`Dank Revival Heist Event!`)
        .setFooter(`Don't forget to thank the sponsor!`)
        .setDescription(`**Sponsor:** ${donation[0]}\n**Amount:** ${donation[1]}\n**Requirements:** <@&${donation[2]}>`)
        .setColor("#BE1100")
        .setTimestamp();
      try{
        await message.channel.send(`${heistPingRole}`, donationEmbed);
      } catch (err) {
        console.log(err);
        message.channel.send('I am not able to send that message.');
      }
    } else {
      console.log(`Nope, noppers, nadda.`);
      message.channel.send('You do not have the required role. Heist Manager Required.');
    }
  }
}
