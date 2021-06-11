const mongoose = require('mongoose');

const guildsSchema = mongoose.Schema({
  guildID: String,
  guildPrefix: String,
  guildName: String,
  guildOwner: String,
  guildMuteRole: String,
  guildHeistManagerRole: String,
  guildGiveawayManagerRole: String,
  guildEventManagerRole: String,
  guildAuctioneerRole: String,
  guildHeistChannel: String,
  guildTestChannel: String,
  guildHeistPing: String,
  guildGiveawayPing: String,
  guildEventPing: String,
  guildLoan: [new mongoose.Schema({
    loanType: String,
    loanUser: String,
    loanGiver: String,
    loanAmount: Number,
    loanLength: Number,
    loanStart: Number,
    loanEnd: Number,
    loanStatus: String
  })],
  guildLottery: [new mongoose.Schema({ 
    lottery: [new mongoose.Schema({ 
      lotteryID: String, 
      userID: String 
    })], 
    lotteryID: String, 
    active: Boolean, 
    owner: String,
    minimumValue: Number,
    maximumValue: Number
  })],
  guildAuctions: [new mongoose.Schema({ 
    bids: [new mongoose.Schema({ 
      auctionID: String, 
      userID: String, 
      bid: Number, 
      item: String 
    })], 
    auctionID: String, 
    active: Boolean, 
    moderator: String,
    seller: String, 
    startingBid: Number,
    highestBid: Number,
    item: String, 
    winner: String
  })],
  donationRoles: [new mongoose.Schema({
    id: String,
    amount: Number
  })]
});

module.exports = mongoose.model('Guilds', guildsSchema);

