const mongo = require("mongodb");
const DBService = require("./DBService");
var MongoClient = mongo.MongoClient;

function getDogMatches(userDogId) {
    var _id = new mongo.ObjectID(userDogId);
    // var criteria = { $or: [{firstDogId: userDogId}, {secondDogId: userDogId} ]};
    var criteria = { $or: [{firstDogId: userDogId}, {secondDogId: userDogId} ] };
  
    return new Promise((resolve, reject) => {
      DBService.dbConnect().then(db => {
        db.collection("match").find(criteria).toArray((err, matches) => {
            console.log('userdog matches', matches);
            if (err) reject(err);
            else resolve(matches);
            db.close();
          });
      });
    });
  }


module.exports = {
   getDogMatches
};