const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const ms = require('ms');
const { Timer } = require('easytimer.js');
const timer = new Timer();
module.exports = class TstartCommand extends BaseCommand {
  constructor() {
    super('tstart', 'giveaways', []);
  }

  async run(client, message, args) {
    if (!args[0]) return message.channel.send('You must provide an amount of time.');
    if (!args[0].includes("d") && !args[0].includes("h") && !args[0].includes('m') && !args[0].includes('s')) return message.channel.send("Incorrect format");
    timer.start({countdown: true, startValues: {secondTenths: Math.floor(ms(args[0])/10)}, target: {seconds: 0}});
    let timeRemaining = timer.getTimeValues().days + timer.getTimeValues().hours + timer.getTimeValues().minutes + timer.getTimeValues().seconds;
    const timerEmbed = new Discord.MessageEmbed()
      .setTitle(args.slice(1).join(' '))
      .setDescription(`**Time Remaining:** ${timeRemaining}`)
      .setFooter('Timer')
      .setColor("RANDOM")
      .setTimestamp();
    let msg = await message.channel.send(timerEmbed);
    timer.addEventListener('secondsUpdated', function (e) {
      timeRemaining = timer.getTimeValues().days + timer.getTimeValues().hours + timer.getTimeValues().minutes + timer.getTimeValues().seconds;
      const timerEmbed = new Discord.MessageEmbed()
      .setTitle(args.slice(1).join(' '))
      .setDescription(`**Time Remaining:** ${timeRemaining}`)
      .setFooter('Timer')
      .setColor("RANDOM")
      .setTimestamp();
      msg.edit(timerEmbed);
    })
    timer.addEventListener('targetAchieved', function (e) {
      const timerEmbed = new Discord.MessageEmbed()
      .setTitle(args.slice(1).join(' '))
      .setDescription(`**Timer Completed**`)
      .setFooter('Timer')
      .setColor("RANDOM")
      .setTimestamp();
      msg.edit(timerEmbed);
    })
  }
}