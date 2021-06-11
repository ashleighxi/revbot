const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');

module.exports = class RaffleCommand extends BaseCommand {
  constructor() {
    super('raffle', 'ServerEvents', []);
  }

  async run(client, message, args) {

    if (message.member.roles.cache.has(`798012491333369886`)) {

    } else {
      console.log(`Nope, noppers, nadda.`);
      message.channel.send('You do not have the required role. Event Manager Required.');
    }
  }
}
