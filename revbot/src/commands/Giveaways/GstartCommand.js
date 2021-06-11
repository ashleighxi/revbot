const BaseCommand = require('../../utils/structures/BaseCommand');
const ms = require('ms');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
const FuzzySearch = require('fuzzy-search');
const Fuse = require('fuse.js');
module.exports = class GstartCommand extends BaseCommand {
  constructor() {
    super('gstart', 'Giveaways', [], 'gstart', 'Start a giveaway.');
  }

  async run(client, message, args) {
    const guild = await guildDB.findOne({ guildID: message.guild.id });
    let giveawayManager = guild.guildGiveawayManagerRole;
    const roleCheck = message.member.roles.cache.has(giveawayManager);
    if(!message.member.hasPermission("ADMINISTRATOR") && !roleCheck) return message.channel.send("You do not have permission to create a giveaway. Requires `ADMINISTRATOR` or the giveaway manager role setup with `(p)setgawmanager`");
    let requirement = args[2];
    if (!args[0] || !args[1] || !args[2] || !args[3]) return message.channel.send('Missing a required argument. `(p)gstart <time> <winners> <requirement> <prize>`');
    if (requirement === 'none') {
      client.giveawaysManager.start(message.channel, {
        time: ms(args[0]),
        prize: args.slice(3).join(' '),
        winnerCount: parseInt(args[1]),
        hostedBy: message.author,
        messages: {
          giveaway: '🎉💀 **GIVEAWAY** 💀🎉',
          giveawayEnded: '💀🎉 **GIVEAWAY ENDED** 🎉💀',
          timeRemaining: 'Time remaining: **{duration}**!',
          inviteToParticipate: 'React with 💀 to participate!',
          winMessage: 'Congratulations, {winners}! You won **{prize}**!\n{messageURL}',
          embedFooter: 'Giveaways',
          noWinner: 'Giveaway cancelled, no valid participations.',
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
    } else {
      let roles = [];
      message.guild.roles.cache.forEach(role => {
        let roleObject = {
          id: role.id,
          name: role.name
        }
        roles.push(roleObject);
      });
      //console.log(roles);
      // const searcher = new FuzzySearch(roles, ['name', 'id'], { sort: true });
      // const result = searcher.search(requirement);
      const options = {
        includeScore: true,
        ignoreLocation: true,
        keys: ['name', 'id']
      }
      const fuse = new Fuse(roles, options)
      const result = fuse.search(requirement);
      console.log(result);
      if (result[0]) {
        client.giveawaysManager.start(message.channel, {
          time: ms(args[0]),
          prize: args.slice(3).join(' '),
          winnerCount: parseInt(args[1]),
          hostedBy: message.author,
          exemptMembers: (member) => !member.roles.cache.some( (r) => r.name === result[0].item.name),
          messages: {
            giveaway: '🎉💀 **GIVEAWAY** 💀🎉',
            giveawayEnded: '💀🎉 **GIVEAWAY ENDED** 🎉💀',
            timeRemaining: 'Time remaining: **{duration}**!',
            inviteToParticipate: `React with 💀 to participate!`,
            winMessage: 'Congratulations, {winners}! You won **{prize}**!\n{messageURL}',
            embedFooter: 'Giveaways',
            noWinner: 'Giveaway cancelled, no valid participations.',
            hostedBy: `Required Role: <@&${result[0].item.id}>\nHosted by: {user}`,
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
          //console.log(gData);
        });
      }
    }
    
  }
}