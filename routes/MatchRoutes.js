
var MatchService = require("../services/MatchService");
var MATCH_URL = "/match";

module.exports = app => {
  app.get(`${MATCH_URL}/:userDogId`, (req, res) => {
    const userDogId = req.params.userDogId;
    
      MatchService.getDogMatches(userDogId)
      .then(matches => {
        res.json(matches);
      })
      .catch(err => res.status(500).send(err.message));
  });


  app.get(`${MATCH_URL}`, (req, res) => {
    const firstDogId = req.query.firstDogId;
    const secondDogId = req.query.secondDogId;

    MatchService.getMatchByDogsIds(firstDogId, secondDogId).
    then(match => {
      res.json(match);
    })
    .catch(err => res.status(500).send(err.message));
  });


  // app.get(`${MATCH_URL}/:matchId`, (req, res) => {

  // })
  // app.post(`${MATCH_URL}`, (req, res) => {
  //   const userDogId = req.body.userDogId;
  //   const filterBy = req.body.filterBy;
    
  //     MatchService.getDogMatches(userDogId, filterBy)
  //     .then(matches => {
  //       res.json(matches);
  //     })
  //     .catch(err => res.status(500).send(err.message));
  // });

};