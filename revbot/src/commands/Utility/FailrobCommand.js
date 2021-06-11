const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class FailrobCommand extends BaseCommand {
  constructor() {
    super('failrob', 'Utility', []);
  }

  async run(client, message, args) {
    message.delete({ timeout: 0 })
    .then(msg => console.log(`Deleted message from ${msg.author.username}`))
    .catch(console.error);
    const helpEmbed = new Discord.MessageEmbed()
      .setTitle(`Failrob Event!`)
      .setFooter(`Thanks for your participating!`)
      .setDescription("__**What is failrob?**__\nThe host will rob the winner of the giveaway with the hope that it will fail, causing the host to pay the winner a portion from their wallet.\n\n__**Rules**__\n-You MUST REMOVE padlocks\n-You MUST REMOVE landmines\nFailure to do so will result in a reroll.")
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
