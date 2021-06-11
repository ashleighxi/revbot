const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const statsDB = require('../../utils/models/botstats.js');
module.exports = class GlobalstatsCommand extends BaseCommand {
  constructor() {
    super('globalstats', 'Info', ['gs']);
  }

  async run(client, message, args) {
    let stats = await statsDB.findOne({});
    const statsEmbed = new Discord.MessageEmbed()
    .setAuthor('revBot Stats', client.user.displayAvatarURL)
    .addField('Giveaways Pinged:', `${stats.giveawaysPinged.toLocaleString()}`, true)
    .addField('Giveaway Donations:', `${stats.giveawayDonations.toLocaleString()}`, true)
    .addField('Heists Pinged:', `${stats.heistsPinged.toLocaleString()}`, true)
    .addField('Heist Donations:', `${stats.heistDonations.toLocaleString()}`, true)
    .addField('Fishing Trips:', `${stats.fishingTrips.toLocaleString()}`, true)
    .addField('Hunting Trips:', `${stats.huntingTrips.toLocaleString()}`, true)
    .addField('Times Begged:', `${stats.timesBegged.toLocaleString()}`, true)
    .addField('Times Robbed:', `${stats.timesRobbed.toLocaleString()}`, true)
    .addField('Times Lurked:', `${stats.timesLurked.toLocaleString()}`, true)
    .addField('Times Worked:', `${stats.timesWorked.toLocaleString()}`, true)
    .addField('Adventures:', `${stats.adventures.toLocaleString()}`, true)
    .addField('Dungeons:', `${stats.dungeons.toLocaleString()}`, true)
    .addField('Raids:', `${stats.raids.toLocaleString()}`, true)
    .addField('Betting Games:', `${stats.timesBet.toLocaleString()}`, true)
    .addField('Slots Games:', `${stats.timesSlots.toLocaleString()}`, true)
    .addField('Overall Wins:', `${stats.overallWins.toLocaleString()}`, true)
    .addField('Overall Losses:', `${stats.overallLosses.toLocaleString()}`, true)
    .addField('Overall Gained:', `$${stats.overallGained.toLocaleString()}`, true)
    .addField('Overall Lost:', `$${stats.overallLost.toLocaleString()}`, true)
    .addField('Overall Net Gain:', `$${stats.overallNet.toLocaleString()}`, true)
    .setFooter(`${client.guilds.cache.size.toLocaleString()} guilds | ${client.users.cache.size.toLocaleString()} users`)
    .setColor("RANDOM")
    .setTimestamp();
    await message.channel.send(statsEmbed).catch(err => console.log(err));
  }
}