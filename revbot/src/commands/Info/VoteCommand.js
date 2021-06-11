const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class VoteCommand extends BaseCommand {
  constructor() {
    super('vote', 'Utility', []);
  }

  async run(client, message, args) {
    const inviteEmbed = new Discord.MessageEmbed()
    .setURL('https://discord.ly/revbot')
    .setTitle('Vote for revBot')
    .setDescription('Invite URL: https://discord.ly/revbot')
    .setFooter('Thanks for using my bot :) - rev')
    .setColor('RANDOM')
    .setTimestamp();

    await message.channel.send(inviteEmbed).catch(err => console.log(err));
  }
}