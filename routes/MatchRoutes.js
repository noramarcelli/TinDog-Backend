
var MatchService = require("../services/MatchService");
var MATCH_URL = "/match";

module.exports = app => {
  app.get(`${MATCH_URL}/:userDogId`, (req, res) => {
    const userDogId = req.params.userDogId;
    
      MatchService.getDogMatches(userDogId)
      .then(matches => {
        console.log('matches', matches);
        res.json(matches);
      })
      .catch(err => res.status(500).send(err.message));
  });

};