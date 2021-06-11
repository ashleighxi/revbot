const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class InviteCommand extends BaseCommand {
  constructor() {
    super('invite', 'Info', []);
  }

  async run(client, message, args) {
    const inviteEmbed = new Discord.MessageEmbed()
    .setURL('https://dsc.gg/revbot')
    .setTitle('Invite revBot')
    .setDescription('Invite URL: https://dsc.gg/revbot')
    .setFooter('Thanks for using my bot :) - rev')
    .setColor('RANDOM')
    .setTimestamp();

    await message.channel.send(inviteEmbed).catch(err => console.log(err));
  }
}