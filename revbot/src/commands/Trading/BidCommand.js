const BaseCommand = require('../../utils/structures/BaseCommand');
const Discord = require('discord.js');
const mongoose = require('mongoose');
const guildDB = require('../../utils/models/guilds.js');
module.exports = class BidCommand extends BaseCommand {
  constructor() {
    super('bid', 'Trading', ['b']);
  }

  async run(client, message, args) {
    let bid = Number(args[0]);
    let guild = await guildDB.findOne({ guildID: message.guild.id });
    let auctions = guild.guildAuctions;
    if (auctions === undefined) return message.channel.send('There are no active auctions currently running.');
    let auction = auctions.find( ({active}) => active === true);
    if (auction === undefined) return message.channel.send('There are no active auctions currently running.');
    if (isNaN(bid)) {
      let option = args[0];
      if (option === 'revert') {
        let auctioneer = guild.guildAuctioneerRole;
        if (!message.member.roles.cache.has(auctioneer)) return message.channel.send('Only Auctioneers can revert bids.');
        let bids = await auction.bids;
        if (bids === undefined) return message.channel.send('This auction has no bids.');
        bids.pop();
        if (bids[bids.length - 1] !== undefined) {
          auction.highestBid = bids[bids.length - 1].bid;
        } else {
          auction.highestBid = auction.startingBid;
        }
        
        await guild.save().catch(err => console.log(err));
        return message.channel.send('last bid removed.');
      } else {
        message.channel.send(`<@!${message.author.id}> Invalid bid - Not a number.`).then(msg => {msg.delete({timeout: 4000})});
        return message.delete( {timeout: 4000} );
      }
      
    } else {
      let bidAmount = bid * 1000000;
      if (bidAmount <= auction.highestBid + 49999 && auction.bids.length > 0) {
        message.channel.send(`<@!${message.author.id}> Invalid bid - Too low. Minimum increase is 50k. LAST BID: **${auction.highestBid.toLocaleString()}**`).then(msg => { msg.delete({timeout: 4000}) });
        return message.delete( {timeout: 4000} );
      }
      if (bidAmount < auction.highestBid) {
        message.channel.send(`<@!${message.author.id}> Invalid bid - Too low. Minimum increase is 50k. LAST BID: **${auction.highestBid.toLocaleString()}**`).then(msg => { msg.delete({timeout: 4000}) });
        return message.delete( {timeout: 4000} );
      }
      auction.bids.push({
        auctionID: auction.auctionID,
        userID: message.author.id,
        bid: bidAmount,
        item: auction.item
      });
      auction.highestBid = bidAmount;
      await guild.save().catch(err => console.log(err));
      message.channel.send(`<@!${message.author.id}> has bid **${bidAmount.toLocaleString()}**!`);
    }
    
    
  }
}