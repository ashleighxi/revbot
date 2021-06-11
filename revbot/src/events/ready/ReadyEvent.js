const { Message } = require('discord.js');
const BaseEvent = require('../../utils/structures/BaseEvent');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const curDB = require('../../utils/models/currency.js');

module.exports = class ReadyEvent extends BaseEvent {
  constructor() {
    super('ready');
  }



  async run (client) {
    console.log(client.user.tag + ' has logged in.');
    client.user.setPresence({
       activity: {
         name: 'ur mom xD',
         type: "WATCHING"
       },
       status: 'dnd'
     })
    .catch(console.error);
    
    setInterval(async () => {
      let cDB = await curDB.find({});
      cDB.sort(function (a,b) {
        return b.balance - a.balance;
      });
      let topTen = cDB.slice(0,10);
      let leaderboard = '';
      topTen.forEach(element => {
        let member = client.users.cache.get(element.userID);
        console.log(`${member.username}: ${element.balance}\n`);
        leaderboard += `${topTen.indexOf(element) + 1}. ${member.username} - ${element.balance} points\n`;
      });
      const lbEmbed = new Discord.MessageEmbed()
        .setTitle('**Dank Revival Season 1 Leaderboard**')
        .setDescription(leaderboard)
        .setFooter('Who will take the top spot?')
        .setTimestamp();
      client.channels.cache.get('811003591485685801').send(lbEmbed);
    }, 3600000);
  }
}
