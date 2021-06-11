const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class GmhelpCommand extends BaseCommand {
  constructor() {
    super('gmhelp', 'Utility', []);
  }

  async run(client, message, args) {
    if (message.channel.id !== '799059293029662741') return message.channel.send("You cannot use this command in this channel.");
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`Giveaway Manager Guide`)
      .setDescription(`These are all the tools you need to do your basic duties as a Giveaway Manager. If you have any further questions, please contact an admin or rev.`)
      .addField("__**Giveaway Creation**__", "We have two giveaway tools that we use:\n**Friskytool:** `+gstart <time> <winners> <requirements> <prize>`\n**Noumenon:** `-g start <time> <winners> <requirements> <prize>` \n\nYou can use either of these, but be aware that they have some minor differences.\nFriskytool Example: `+gstart 10m 1w footman 250k`\nNoumenon Example: `-g start 10m 2w none 250k`")
      .addField("__**Giveaway Pings**__",`Firstly, some rules:\n1. Do not double ping.\n2. Only ping giveaways with revBot\n3. Please wait AT LEAST 5mins between pings.\n\n**Giveaway Ping:** \`//gping <mention sponsor> <message> \`\n**Giveaway Ping Example:** \`//gping @rev#0002 hi this is a test\`\nYou can test the above command in here using \`//gtestping <mention> <message>\``)
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
