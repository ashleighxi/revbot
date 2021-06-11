const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class RewardsCommand extends BaseCommand {
  constructor() {
    super('rewards', 'Currency', [], undefined, undefined);
  }

  async run(client, message, args) {
    const shopEmbed = new Discord.MessageEmbed()
      .setTitle('__**Revival Season Shop**__')
      .setDescription('Spend your **points balance** here to redeem awesome rewards!')
      .addField('__**Roles/Passes:**__', '**S1 Pass Player** - 200 points\n**S1 Pass Legend** - 300 points\n**S1 Pass God** - 500 points')
      .addField('__**Random:**__', '**Personal Announcement (No ping)** - 500 points\n**Private Channel (no member limit)** - 500 points')
      .addField('__**Nitros:**__', '**Nitro Classic** (8 in stock) - 800 points\n**$10 Nitro** (8 in stock) - 950 points\n*Though it\'s not required, we ask those who win nitro to boost our server.*')
      .setFooter('Thank you!')
      .setColor("RANDOM")
      .setTimestamp();

    await message.channel.send(shopEmbed).catch(err => console.log(err));
  }
}