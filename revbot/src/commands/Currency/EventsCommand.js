const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const eventsDB = require('../../utils/models/events.js');
const ms = require('ms');
const humanizeDuration = require('humanize-duration');
module.exports = class EventsCommand extends BaseCommand {
  constructor() {
    super('events', 'Currency', [], undefined, undefined);
  }

  async run(client, message, args) {
    const com = args[0];
    if (com === 'add') {
      let slicer;
      let eventName;
      let eventDate;
      for (let i = 0; i < args.length; i++) {
        const element = args[i];
        if (element === '|') {
          eventName = args.slice(1,i).join(' ');
          eventDate = args.slice(i+1).toString();
          if (!eventDate || !eventName) return message.channel.send('You must include an event name and date. //events add <event_name> | <MM/DD/YYYY>');
          let eDB = new eventsDB({
            event: eventName,
            date: eventDate
          })
          await eDB.save().catch(err => console.log(err));
          await message.channel.send(`Event ${eventName} successfully created for ${eventDate}`).catch(err => console.log(err));
        }
      }
    } else if (com === 'remove') {
      let eventName = args.slice(1).join(' ');
      await eventsDB.deleteOne({ event: eventName }).catch(err => console.log(err));
      await message.channel.send(`Event ${eventName} successfully removed.`).catch(err => console.log(err));
    } else {
      let eDB = await eventsDB.find({});
      let descStr = '';
      eDB.forEach(element => {
        descStr += `${element.event}: ${element.date}\n`;
      });
      const eventEmbed = new Discord.MessageEmbed()
        .setTitle('Dank Revival Events')
        .setDescription(descStr)
        .setFooter('Ask an admin for more information!')
        .setTimestamp();
      await message.channel.send(eventEmbed).catch(err => console.log(err));
    }
  }
}