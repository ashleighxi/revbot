
const { Client, DiscordAPIError } = require('discord.js');
const { registerCommands, registerEvents } = require('./utils/registry');
const config = require('../slappey.json');
const client = new Client({ disableMentions: 'everyone' });
const express = require('express');
const dbconfig = require('./config/default.json');
const mongoose = require('mongoose');
const app = express();
const dbots = require('dbots');

const { GiveawaysManager } = require('discord-giveaways');
const db = config.mongoURI;

client.snipes = new Map();

(async () => {
  client.commands = new Map();
  client.events = new Map();
  client.prefix = config.prefix;
  // client.error = new Map();
  // client.logchannel = ["796236163681091594", "834504826262913066"];
  const manager = new GiveawaysManager(client, {
    storage: './giveaways.json',
    updateCountdownEvery: 10000,
    hasGuildMembersIntent: false,
    default: {
      botsCanWin: false,
      exemptPermissions: [],
      embedColor: '#af45ed',
      reaction: '💀'
    }
  });
  manager.on('giveawayEnded', (giveaway, winners) => {
    winners.forEach( (member) => {
      member.send('Congratulations, ' +member.user.username+', you won: '+giveaway.prize+'\n'+giveaway.messageURL);
      
    });
    let host = getUserFromMention(giveaway.hostedBy);
    host.send('Your giveaway for '+giveaway.prize+' has ended!\n'+giveaway.messageURL);
  });
  manager.on('giveawayReactionAdded', async (giveaway, member, reaction) => {
    if (giveaway.messages.embedFooter === "Drops") {
      manager.end(giveaway.messageID);
    } else {
      let qualification = await giveaway.exemptMembers(member);
      if (qualification) {
        reaction.users.remove(member.user);
        member.send("You do not meet the requirement for this giveaway.");
      }
    }
  });
  client.giveawaysManager = manager;

  mongoose.connect("", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');
  await client.login(config.token);
  // process.on('unhandledRejection', async error => {
  //   let errorChannel = await client.channels.fetch('834504826262913066');
  //   errorChannel.send(error);
  // })
  const poster = new dbots.Poster({
    client,
    apiKeys: {
      discordbotlist: '',
      botsfordiscord: ''
    },
    clientLibrary: 'discord.js'
  });

  
  poster.startInterval();

})();

function getUserFromMention(mention) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
}