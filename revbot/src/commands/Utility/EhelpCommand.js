const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js')
module.exports = class EhelpCommand extends BaseCommand {
  constructor() {
    super('ehelp', 'Utility', []);
  }

  async run(client, message, args) {
    message.delete({ timeout: 0 })
    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
    .catch(console.error);
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`How to donate to a Dank Revival Event`)
      .setFooter(`Thanks for your patience!`)
      .setDescription("Use the command `//enter` to call an Events Manager\nMinimum Donation Amount: `50000`\nPay directly to the Events Manager or whoever they EXPLICITLY tell you\n**YOU MUST PAY TAX**")
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
