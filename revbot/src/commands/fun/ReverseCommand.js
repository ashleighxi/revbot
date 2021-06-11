const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class ReverseCommand extends BaseCommand {
  constructor() {
    super('reverse', 'fun', []);
  }

  async run(client, message, args) {
    if (!args[0]) return message.channel.send('You must input text to be reversed.');
    let textReversed = args.join(' ').split('').reverse().join('');
    message.channel.send(textReversed);
  }
}