const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class PingCommand extends BaseCommand {
  constructor() {
    super('ping', 'Utility', []);
  }

  async run(client, message, args) {
    message.channel.send('Loading data').then(async (msg) => {
      msg.delete();
      message.channel.send(`🏓Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    });
  }
}
