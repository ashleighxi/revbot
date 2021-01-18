const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class GpingCommand extends BaseCommand {
  constructor() {
    super('gping', 'Utility', []);
  }

  async run(client, message, args) {
    if(message.member.roles.cache.has(`796952971794972713`)) {
      console.log(`Yay, the author of the message has the role!`);
      let donation = args.join(" ").split(' ');
      let user = message.author.id;
      const giveawayPingRole = message.guild.roles.cache.get(`796236163681091595`);
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
        await message.channel.send(`${giveawayPingRole}`, donationEmbed);
      } catch (err) {
        console.log(err);
        message.channel.send('I am not able to send that message.');
      }
    } else {
      console.log(`Nope, noppers, nadda.`);
      message.channel.send('You do not have the required role. Giveaway Manager Required.');
    }

  }
}
