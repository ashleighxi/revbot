const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class DonateCommand extends BaseCommand {
  constructor() {
    super('donate', 'Utility', []);
  }

  async run(client, message, args) {
    let donation = args.join(" ").split('|');
    let user = message.author.id;
    const giveawayManagerRole = message.guild.roles.cache.get(`796952971794972713`);
    console.log(`${donation}`);
    const donationEmbed = new Discord.MessageEmbed()
      .setThumbnail(`https://cdn.discordapp.com/emojis/796813658890043453.png?v=1`)
      .setTitle(`Giveaway Donation Request`)
      .setFooter(`Thanks for donating to Dank Revival!`)
      .setDescription(`**Sponsor:** <@!${user}>\n**Timer:** ${donation[0]}\n**Winners:** ${donation[1]}\n**Requirements:** ${donation[2]}\n**Prize:** ${donation[3]}`)
      .setColor("#BE1100")
      .setTimestamp();
    try{
      await message.channel.send(`${giveawayManagerRole}`, donationEmbed);
    } catch (err) {
      console.log(err);
      message.channel.send('I am not able to send that message.');
    }
  }
}
