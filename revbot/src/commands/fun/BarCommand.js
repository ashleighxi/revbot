const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class BarCommand extends BaseCommand {
  constructor() {
    super('bar', 'Fun', [], 'bar', 'It\'s just a bar.');
  }

  async run(client, message, args) {
    const line = client.emojis.cache.get('833542341255233546');
    message.delete({ timeout: 0 }).then( () => {
      message.channel.send(`${line}${line}${line}${line}${line}${line}`);
    });
    
  }
}