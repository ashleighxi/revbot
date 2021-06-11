const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');

module.exports = class FlCommand extends BaseCommand {
  constructor() {
    super('alt', 'Moderation', []);
  }

  async run(client, message, args) {
    //Permission Checking:
    if(!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You do not have permission to ban someone.");
    if(!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send("My role does not have the ban permission.");

    //Variables:
    let reason = "You have been found in violation of our rules regarding alts. If you think this is a mistake or you would like to provide context, you can appeal at: https://docs.google.com/forms/d/e/1FAIpQLSc78AvsDLDusX5ccPxjgGTZ4Hr9O92cmSlEI-VMIB2QB91PlQ/viewform";
    if (!args[0]) return message.channel.send('You must give a dirty alt to ban. \`//alt @user\`');
    const mentionedMember = message.mentions.members.first() || await client.users.fetch(args[0]);
    //Input Checking:
    
    
      
    
    if (!mentionedMember) return message.channel.send("The member mentioned is not here idiot.");
    if (mentionedMember.id == message.author.id) return message.channel.send('You can\'t ban yourself dumbass. (like Jess did xD)');
    if (mentionedMember.id == client.user.id) return message.channel.send('smh my head. you really tryna get smacked the fuck up, huh?');
    if (mentionedMember.roles) {
      if (message.member.roles.highest.position <= mentionedMember.roles.highest.position) return message.channel.send('You cannot ban someone higher in the hierarchy than you.');
    }
    //Executing:
    const banEmbed = new Discord.MessageEmbed()
      .setTitle(`You have been banned from ${message.guild.name}`)
      .setDescription(`${reason}`)
      .setTimestamp()
      .setColor("#BE1100");

    await mentionedMember.send(banEmbed).catch(err => console.log(err));
    await message.guild.members.ban(mentionedMember, {
        days: 0,
        reason: reason
    }).catch(err => console.log(err)).then(() => message.channel.send(`Successfully banned ${mentionedMember.tag || mentionedMember.user.tag}`));
  }
}
