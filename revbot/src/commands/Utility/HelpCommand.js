const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
module.exports = class HelpCommand extends BaseCommand {
  constructor() {
    super('help', 'Utility', []);
  }

  async run(client, message, args) {
    const helpEmbed = new Discord.MessageEmbed()
      .setAuthor(`revBot Help`, `${message.guild.me.user.avatarURL()}`)
      .setTitle(`__**Command List**__`)
      .addField('**Fun:**', '`say`, `lottery`')
      .addField("**Currency:**", '`balance`, `daily`, `beg`, `fish`, `hunt`, `work`, `lurk`, `rob`, `venture`, `dungeon`, `raid`, `bet`, `slots`, `buy`, `sell`, `deposit`, `withdraw`, `item`, `store`, `profile`, `ginfo`')
      .addField("**Call Commands:**","`donate`, `hdonate`")
      .addField("**Ping Commands (Staff only):**", "`gping`, `hping`")
      .addField("**Trading Commands:**", "`auction`, `bid`, `vouch`, `vouches`")
      .addField("**Moderation:**", "`alt`, `ban`, `mute`, `scammer`, `tempban`, `tempmute`, `unban`, `unmute`, `whois`, `setmuterole`")
      .addField("**Utility:**", "`snipe`, `setgawmanager`, `setgawping`, `setheistmanager`, `setheistping`, `setauctioneer`")
      .addField("**Info:**", "`help`, `botinfo`, `ping`, `ghelp`, `hhelp`,")
      .setFooter("//help <command> for more specific info. (Not available for all commands currently)")
      .setColor("#BE1100")
      .setTimestamp();
    if (args[0] === 'hping') {
      const hping = new Discord.MessageEmbed()
      .setAuthor(`revBot Help`, `${message.guild.me.user.avatarURL()}`)
      .setTitle(`__**hping (Heist Ping)**__`)
      .setDescription('This command is used to ping heists. This command requires running `//setheistmanager` and `//setheistping` before it will function correctly.')
      .addField('Usage: ', '`//hping <sponsor mention> <amount> <requirement_role_name>`')
      .addField('Example:', '`//hping @rev 10,000,000 member`')
      .setFooter('DM rev#0002 with any further questions')
      .setTimestamp()
      .setColor('#BE1100');
      await message.channel.send(hping).catch(err => console.log(err));
    } else if (args[0] === 'gping') {
      const gping = new Discord.MessageEmbed()
      .setAuthor(`revBot Help`, `${message.guild.me.user.avatarURL()}`)
      .setTitle(`__**gping (Giveaway Ping)**__`)
      .setDescription('This command is used to ping giveaways. This command requires running `//setgawmanager` and `//setgawping` before it will function correctly.')
      .addField('Usage: ', '`//gping <sponsor> <message>`')
      .addField('Example:', '`//gping @rev this is a message`')
      .setFooter('DM rev#0002 with any further questions')
      .setTimestamp()
      .setColor('#BE1100');
      await message.channel.send(gping).catch(err => console.log(err));
    } else if (args[0] === 'lottery') {
      const lottery = new Discord.MessageEmbed()
      .setAuthor(`revBot Help`, `${message.guild.me.user.avatarURL()}`)
      .setTitle(`__**lottery (Guild Lottery System)**__`)
      .setDescription('This command is used to start lotteries for you guild. You must define a lowest possible amount to win, and a highest possible amount to win. It will roll a random winner and value between your lowest and highest possible amounts.')
      .addField('Usage: ', 'Starting: `//lottery <minimum_value> <maximum_value>`\nCheck Status: `//lottery`\nEnding: `//lottery end`')
      .addField('Example:', '`//lottery start 1e6 5e6`\n`//lottery`\n`//lottery end`')
      .setFooter('DM rev#0002 with any further questions')
      .setTimestamp()
      .setColor('#BE1100');
      await message.channel.send(lottery).catch(err => console.log(err));
    } else if (args[0] === 'auction') {
      const auction = new Discord.MessageEmbed()
      .setAuthor(`revBot Help`, `${message.guild.me.user.avatarURL()}`)
      .setTitle(`__**auction (Guild Auction System)**__`)
      .setDescription('This command is used to start auctions for you guild. You must set the auctioneer role with `//setauctioneer <role_id>`. Users will use the `//bid` command to bid on auctions. Values are defaulted to millions. Check examples to see what this means.')
      .addField('Usage: ', 'Creating: `//auction <seller> <quantity> <item> <starting_price>`\nStarting: `//auction start <auctionID>`')
      .addField('Example:', '`//auction @rev 10 banks 1m`\n`//auction start 10`')
      .setFooter('DM rev#0002 with any further questions')
      .setTimestamp()
      .setColor('#BE1100');
      await message.channel.send(auction).catch(err => console.log(err));
    } else if (args[0] === 'bid') {
      const bid = new Discord.MessageEmbed()
      .setAuthor(`revBot Help`, `${message.guild.me.user.avatarURL()}`)
      .setTitle(`__**bid (Bid on Auctions)**__`)
      .setDescription('This command is used to bid on auctions in your guild. Values are defaulted to millions. Check examples to see what this means.')
      .addField('Usage: ', '`//bid <amount>`')
      .addField('Example:', '`//bid 1` (Bids 1mil)\n`//bid 1.5` (Bids 1.5mil)')
      .setFooter('DM rev#0002 with any further questions')
      .setTimestamp()
      .setColor('#BE1100');
      await message.channel.send(bid).catch(err => console.log(err));
    } else if (args[0] === 'dungeon') {
      const bid = new Discord.MessageEmbed()
      .setAuthor(`revBot Help`, `${message.guild.me.user.avatarURL()}`)
      .setTitle(`__**dungeon**__`)
      .setDescription('This command is used to start a dungeon. You must have a class to do dungeons. Do //class to choose one. View the dungeon list with //dung list')
      .addField('Usage: ', '`//dungeon <dungeon_name>`')
      .addField('Example:', '`//dungeon fort')
      .setFooter('DM rev#0002 with any further questions')
      .setTimestamp()
      .setColor('#BE1100');
      await message.channel.send(bid).catch(err => console.log(err));
    } else {
      try {
        await message.channel.send(helpEmbed);
      } catch (err) {
        console.log(err);
        message.channel.send('I am not able to send that message.');
      }
    }
    
  }
}
