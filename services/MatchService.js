const mongo = require("mongodb");
const DBService = require("./DBService");
var MongoClient = mongo.MongoClient;

function getDogMatches(userDogId) {
    var _id = userDogId;
    var criteria = { $or: [{firstDogId: userDogId}, {secondDogId: userDogId} ] };
  
    return new Promise((resolve, reject) => {
      DBService.dbConnect().then(db => {
        db.collection('match').find(criteria).toArray((err, matches) => {
            console.log('userdog matches', matches);
            if (err) reject(err);
            else resolve(matches);
            db.close();
          });
      });
    });
  }

  function addMsgToMatch(matchId, msg) {
    console.log({matchId});
    matchId = new mongo.ObjectID(matchId);
    return DBService.dbConnect().then(db => {
      return db.collection('match').updateOne({_id: matchId}, {$push: {messages: msg}})
              .then(res => {
                console.log('updateOne response in addMsgToMatch:', res);
                return res;
              })
  })
}

function getMatchByDogsIds(firstDogId, secondDogId) {

console.log('inside getMatchByDogsIds');


 var firstDogId = new mongo.ObjectID(firstDogId);
 var secondDogId = new mongo.ObjectID(secondDogId);

//  { $or: [ { quantity: { $lt: 20 } }, { price: 10 } ] } 
// var criteria = { $and: [{ _id }, { pendingLikesIds: userDogId }] };

 var criteria = { $and: [{ firstDogId }, { secondDogId }] };
 
  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db.collection("match").findOne({ criteria }, function(err, match) {
        if (err) reject(err);
        else resolve(match);
        db.close();
      });
    });
  });
}


module.exports = {
   getDogMatches,
   addMsgToMatch,
   getMatchByDogsIds
};