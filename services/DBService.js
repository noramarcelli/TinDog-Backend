// var DB_URL = "mongodb://noramarcelli:xxpz2462@ds117730.mlab.com:17730/tindog";
var DB_URL = 'mongodb://admin:admin@ds117730.mlab.com:19090/elad'
// var DB_URL = 'mongodb://localhost:27017/tinDog';

const mongo = require("mongodb");

var MongoClient = mongo.MongoClient;

function dbConnect() {
  var prmConnect = new Promise((resolve, reject) => {
    // MongoClient.connect(DB_URL, function(err, db) {
    MongoClient.connect(DB_URL, function(err, db) {
      if (err) reject(err);
      else {
        resolve(db);
      }
    });
  });
  prmConnect.catch(err => console.error("Cannot Connect!", err));
  return prmConnect;
}

// dbConnect().then(db => {
//   db.collection('dog').find({}).toArray().then(console.log)
// })

module.exports = {
  dbConnect
};
