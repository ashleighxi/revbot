const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class HhelpCommand extends BaseCommand {
  constructor() {
    super('hhelp', 'Utility', []);
  }

  async run(client, message, args) {
    message.delete({ timeout: 0 })
    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
    .catch(console.error);
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`How to donate towards Dank Revival Heists`)
      .setFooter(`Thanks for your patience!`)
      .setDescription("**Use:** `<hdonate (Requirements) | (Amount)`\n\n**Example:** <hdonate none | 1mil\n**Example:** <hdonate footman | 5mil\n**Note:** Please use **|** to separate each category.\n**1mil Minimum**")
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
