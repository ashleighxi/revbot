const BaseCommand = require('../../utils/structures/BaseCommand');
const ms = require('ms');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const FuzzySearch = require('fuzzy-search');
const Fuse = require('fuse.js');
module.exports = class DropCommand extends BaseCommand {
  constructor() {
    super('drop', 'Giveaways', ['gdrop']);
  }

  async run(client, message, args) {
    const guild = await guildDB.findOne({ guildID: message.guild.id });
    let giveawayManager = guild.guildGiveawayManagerRole;
    const roleCheck = message.member.roles.cache.has(giveawayManager);
    if(!message.member.hasPermission("ADMINISTRATOR") && !roleCheck) return message.channel.send("You do not have permission to create a giveaway. Requires `ADMINISTRATOR` or the giveaway manager role setup with `(p)setgawmanager`");
    
    if (!args[0]) return message.channel.send('Missing a required argument. `(p)drop <prize>`');
    
    client.giveawaysManager.start(message.channel, {
      time: 30000,
      prize: args.slice(0).join(' '),
      winnerCount: 1,
      hostedBy: message.author,
      messages: {
        giveaway: '🎉💀 **DROP** 💀🎉',
        giveawayEnded: '💀🎉 **DROP ENDED** 🎉💀',
        timeRemaining: 'Time remaining: **{duration}**!',
        inviteToParticipate: 'First to react with 💀 wins!',
        winMessage: 'Congratulations, {winners}! You won **{prize}**!\n{messageURL}',
        embedFooter: 'Drops',
        noWinner: 'Drop cancelled, no valid participations.',
        hostedBy: 'Hosted by: {user}',
        winners: 'winner(s)',
        endedAt: 'Ended at',
        units: {
            seconds: 'seconds',
            minutes: 'minutes',
            hours: 'hours',
            days: 'days',
            pluralS: false // Not needed, because units end with a S so it will automatically removed if the unit value is lower than 2
        }
    }
    }).then((gData) => {
      message.delete({ timeout: 0 });
      
    });
    
    
  }
}