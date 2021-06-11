const app = require('express')();
const {Timers} = require ('../data/variable');
module.exports = async (client) => {
  app.get("/api/timers", async (req, res) => {
    let arr = [];
    Timers.forEach(timer => {
      arr.push({GUILD: timer.Guild, AUTHOR: {ID: timer.Author.ID, TAG: timer.Author.Tag}, TIME_IN_MS: timer.Time});
    });
    res.send(arr);
  });
  app.listen(8080);
}