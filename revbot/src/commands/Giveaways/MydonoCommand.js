const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const donationDB = require('../../utils/models/donations');
const guildDB = require('../../utils/models/guilds');
module.exports = class DonoCommand extends BaseCommand {
  constructor() {
    super('mydono', 'Giveaways', ['myd']);
  }
  async run(client, message, args) {
    let target = message.author.id;
    const user = await donationDB.findOne({ id: target });
    const donoEmbed = new Discord.MessageEmbed();
    if (user) {
      let guildCheck = user.donations.find( ({guild}) => guild === message.guild.id);
      let localDonations = 0;
      let globalDonations = 0;
      if (guildCheck) {
        localDonations = guildCheck.amount;
      }
      user.donations.forEach(donation => {
        globalDonations += donation.amount;
      });
      donoEmbed.setTitle(`${message.author.username}'s Donations`);
      donoEmbed.setDescription(`Local Donations: \`${localDonations.toLocaleString()}\`\nGlobal Donations: \`${globalDonations.toLocaleString()}\``);
      message.channel.send(donoEmbed);
    } else {
      donoEmbed.setTitle('Oops!');
      donoEmbed.setDescription('I couldn\'t find you in the database.');
      message.channel.send(donoEmbed);
    }
  }
}