const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');

module.exports = class GhelpCommand extends BaseCommand {
  constructor() {
    super('ghelp', 'Utility', []);
  }

  async run(client, message, args) {
    message.delete({ timeout: 0 })
    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
    .catch(console.error);
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`How to donate towards Dank Revival Giveaways`)
      .setFooter(`Thanks for your patience!`)
      .setDescription("**Use:** `<donate (time) | (winners) | (Requirements) | (prize)`\n\n**Example:** <donate 5m | 2 | none | 1mil (500k each)\n**Example:** <donate 1h | 1 | footman | 250k\n**Note:** Please use **|** to separate each category.\n**100k Minimum**")
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
