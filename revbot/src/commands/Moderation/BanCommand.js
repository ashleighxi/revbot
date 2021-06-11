const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');

module.exports = class FlCommand extends BaseCommand {
  constructor() {
    super('ban', 'Moderation', []);
  }

  async run(client, message, args) {
    //Permission Checking:
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You do not have permission to ban someone.");
    if(!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send("My role does not have the ban permission.");

    //Variables:
    let reason = args.slice(1).join(" ");
    if (!reason) reason = 'None given';
    if (!args[0]) return message.channel.send('You must give a dirty rulebreaker to ban. \`//ban @user\`');
    let mentionedMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || await client.users.fetch(args[0]);
    let userID;
    console.log(mentionedMember);
    console.log(mentionedMember.user);
    //Input Checking:
    if (!mentionedMember.roles && mentionedMember.user) mentionedMember = mentionedMember.user;
    if (!mentionedMember) userID = args[0];
    
    if (mentionedMember) {
      if (mentionedMember.id == message.author.id) return message.channel.send('You can\'t ban yourself dumbass. (like Harry did xD)');
      if (mentionedMember.id == client.user.id) return message.channel.send('smh my head. you really tryna get smacked the fuck up, huh?');
      if (mentionedMember.roles) {
        if (message.member.roles.highest.position <= mentionedMember.roles.highest.position) return message.channel.send('You cannot ban someone higher in the hierarchy than you.');
      }
    }
    

    console.log(mentionedMember);
    //Executing:
    const banEmbed = new Discord.MessageEmbed()
      .setTitle(`You have been banned from ${message.guild.name}`)
      .setDescription(`**Reason:** ${reason}\n**Moderator:** ${message.member.user.tag}\n*If you think this is a mistake, appeal here:* https://docs.google.com/forms/d/e/1FAIpQLSc78AvsDLDusX5ccPxjgGTZ4Hr9O92cmSlEI-VMIB2QB91PlQ/viewform`)
      .setTimestamp()
      .setColor("#BE1100");
    const modLogEmbed = new Discord.MessageEmbed()
      .setTitle(`${mentionedMember.username} has been banned from ${message.guild.name}`)
      .setDescription(`**Reason:** ${reason}\n**Moderator:** ${message.member.user.tag}\n*If you think this is a mistake, appeal here:* https://docs.google.com/forms/d/e/1FAIpQLSc78AvsDLDusX5ccPxjgGTZ4Hr9O92cmSlEI-VMIB2QB91PlQ/viewform`)
      .setTimestamp()
      .setColor("#BE1100");

    await mentionedMember.send(banEmbed).catch(err => console.log(err));
    await message.guild.members.ban(mentionedMember,{
        days: 0,
        reason: reason
    }).catch(err => console.log(err)).then(() => message.channel.send(`Successfully banned ${mentionedMember.tag || mentionedMember.user.tag}`));
    const modLog = message.guild.channels.cache.get('796248050645205052');
    await modLog.send(modLogEmbed).catch(err => console.log(err));
    
  }
}
