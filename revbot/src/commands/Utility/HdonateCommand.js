const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');

module.exports = class HdonateCommand extends BaseCommand {
  constructor() {
    super('hdonate', 'Utility', []);
  }

  async run(client, message, args) {
    let donation = args.join(" ").split('|');
    let user = message.author.id;
    const heistManagerRole = message.guild.roles.cache.get(`796953585295294514`);
    console.log(`${donation}`);
    const donationEmbed = new Discord.MessageEmbed()
      .setThumbnail(`https://cdn.discordapp.com/emojis/796813658890043453.png?v=1`)
      .setTitle(`Heist Donation Request`)
      .setFooter(`Thanks for donating to Dank Revival!`)
      .setDescription(`**Sponsor:** <@!${user}>\n**Requirements:** ${donation[0]}\n**Amount:** ${donation[1]}`)
      .setColor("#BE1100")
      .setTimestamp();
    try{
      await message.channel.send(`${heistManagerRole}`, donationEmbed);
    } catch (err) {
      console.log(err);
      message.channel.send('I am not able to send that message.');
    }
  }
}
