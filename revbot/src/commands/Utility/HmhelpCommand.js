const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class HmhelpCommand extends BaseCommand {
  constructor() {
    super('hmhelp', 'Utility', []);
  }

  async run(client, message, args) {
    if (message.channel.id !== '799059293029662741') return message.channel.send("You cannot use this command in this channel.");
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`Heist Manager Guide`)
      .setDescription(`These are all the tools you need to do your basic duties as a Heist Manager. If you have any further questions, please contact an admin or rev.`)
      .addField("__**Heist Creation**__", "For heists, we use Noumenon to initiate a heist event countdown:\n**Less than 10mil Heist:** `-heist start <role> --amt <amount>` \n**Greater than 10mil Heist:** `-heist start <role> --long --amt <amount>` \n<10mil Example: `-heist start none --amt 5e6`\n>10mil Example: `-heist start footman --long --amt 50e6`")
      .addField("__**Heist Pings**__",`Firstly, some rules:\n1. Do not double ping.\n2. Only ping heists with revBot\n3. Please create a giveaway timer between 1-5 minutes so people know when it will begin.\n\n**Heist Ping:** \`//hping <mention sponsor> <amount> <requirement> \`\n**Heist Ping Example:** \`//hping @rev#0002 10,000,000 footman\`\nYou can test the above command in here using \`//htestping <mention> <amount> <requirement>\``)
      .setFooter("Thanks! - rev and the admins")
      .setColor("#BE1100")
      .setTimestamp();
    try {
      await message.channel.send(helpEmbed);
    } catch (err) {
      console.log(err);
      message.channel.send('I am not able to send that message.');
    }


  }
}
