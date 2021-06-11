const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js')
module.exports = class RhelpCommand extends BaseCommand {
  constructor() {
    super('rhelp', 'Utility', []);
  }

  async run(client, message, args) {
    message.delete({ timeout: 0 })
    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
    .catch(console.error);
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`How to enter Dank Revival's Raffle`)
      .setFooter(`Thanks for your patience!`)
      .setDescription("Use the command `//enter` to call an Events Manager\nEach ticket costs: `50000`\nTicket limit: `30`\nPay directly to <@!800831673910296616>\n**YOU MUST PAY TAX**")
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
