const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class MmhelpCommand extends BaseCommand {
  constructor() {
    super('mmhelp', 'Utility', []);
  }

  async run(client, message, args) {
    message.delete({ timeout: 0 })
    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
    .catch(console.error);
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`Need a middleman?`)
      .setFooter(`Thanks for your patience!`)
      .setDescription("\n**Use:** `//mm`\n\nA middleman should arrive shortly!\n")
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
