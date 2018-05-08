const mongo = require("mongodb");
const DBService = require("./DBService");
var cloudinary = require("cloudinary");
var MongoClient = mongo.MongoClient;
var cloudinaryIsInit = false;

function getDogs() {
  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db
        .collection("dog")
        .find({})
        .toArray((err, dogs) => {
          if (err) reject(err);
          else resolve(dogs);
          db.close();
        });
    });
  });
}

function getById(dogId) {
  console.log({dogId})
  dogId = new mongo.ObjectID(dogId);
  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db.collection("dog").findOne({ _id: dogId }, function(err, dog) {
        if (err) reject(err);
        else resolve(dog);
        db.close();
      });
    });
  });
}

function getNextDogs(prevId, userDogId) {
  console.log({ prevId });
  var criteria = {};
  if (prevId)
    criteria._id = {
      $gt: new mongo.ObjectID(prevId),
      $ne: new mongo.ObjectID(userDogId)
    };
  else criteria._id = { $ne: new mongo.ObjectID(userDogId) };
  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db
        .collection("dog")
        .find(criteria)
        .limit(2)
        .toArray((err, dogs) => {
          if (err) reject(err);
          else resolve(dogs);
          db.close();
        });
    });
  });
}

function deleteDog(dogId) {
  dogId = new mongo.ObjectID(dogId);
  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db.collection("dog").deleteOne({ _id: dogId }, function(err, res) {
        if (err) reject(err);
        else resolve();
        db.close();
      });
    });
  });
}

function addDog(dog) {
  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db.collection("dog").insert(dog, function(err, res) {
        if (err) reject(err);
        else resolve(res.ops[0]);
        db.close();
      });
    });
  });
}
function updateDog(dog) {
  dog._id = new mongo.ObjectID(dog._id);

  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db
        .collection("dog")
        .updateOne({ _id: dog._id }, dog, function(err, updatedDog) {
          if (err) reject(err);
          else resolve(updatedDog);
          db.close();
        });
    });
  });
}

function uploadImg(imgUrl) {
  _initCloudinary();

  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(imgUrl, (err, res) => {
      console.log("res", res);
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function _initCloudinary() {
  if (!cloudinaryIsInit) {
    cloudinary.config({
      cloud_name: "ilanamost",
      api_key: "126843244928435",
      api_secret: "Pn9z1wRYWbHXb_lAX_zM5QTAUJY"
    });
    cloudinaryIsInit = true;
  }
}

// function addLike(likedId, userDogId) {
//   return DBService.dbConnect()
//     .then(db => {
//       return db
//         .collection("dog")
//         .findOneAndUpdate(
//           { _id: new mongo.ObjectID(userDogId) },
//           { $push: { pendingLikesIds: likedId } },
//           { returnOriginal: false }
//         );
//     })
//     .then(res => {
//       if (res.value) return res.value;
//       throw new Error("could not update dog");
//     });
// }

function addLike(likedId, userDogId, userId) {
  console.log('userId inside addLike', userId);
  return DBService.dbConnect()
    .then(db => {
      return db
        .collection("dog")
        .findOneAndUpdate(
          { _id: new mongo.ObjectID(userDogId) },
          { $push: { pendingLikesIds: likedId } },
          { returnOriginal: false }
        );
    })
    .then(res => {
      if (res.value) {
        // return _getMatchedDog(likedId, userDogId)
        return _getMatchedDog(likedId, userDogId)
        .then(matchedDog => {
          if (!matchedDog) return
          console.log('matchedDog in _getMatchedDog promise result', matchedDog);

          // this.$socket.emit('newMatch', matchedDog);
          
          return _createMatch(userId, matchedDog.userId, userDogId, likedId)
          .then(matchId => {
            console.log('match made!!!, matchId:', matchId)
            console.log('matchedDog inside createMatch', matchedDog);
            
            // this.$socket.emit('newMatch', matchedDog);
            return matchId
          }).catch((err) => {reject(err)});
        });
        // return res.value;
      }
      else {
        console.log({res})
        throw new Error("could not update dog");
      }
    });
}

function _createMatch(userId, likedDogUserId, userDogId, likedId) {
    // _addMatch(userId, likedDogUserId, userDogId, likedId).then(matchId => {
    //   console.log('matchId', matchId);
      
    //   _addToMatches(userDogId, likedId, matchId);
    // })

    return _addMatch(userId, likedDogUserId, userDogId, likedId)
    .then(matchId => {
      console.log('matchId', matchId);

      return _addToMatches(userDogId, likedId, matchId)
      .then(() => {
        return _deleteFromLikes(userDogId, likedId)
      })
      .then(() => matchId)


    // _addMatchToUserDog(likedId, userDogId);
    // _addMatchToLikedDog(likedId, userDogId);

    // _addMatchToDog(userDogId, likedId);
    // _addMatchToDog( likedId, userDogId);
    // _addToMatches(userDogId, likedId);
    // if (err) reject(err);
    // else resolve();
  });
}

function _deleteFromLikes(userDogId, likedId){
  var deleteLikePrms = [];
  deleteLikePrms.push(_deleteFromDog(userDogId, likedId));
  deleteLikePrms.push(_deleteFromDog( likedId, userDogId));
  return Promise.all(deleteLikePrms)
}


function _deleteFromDog(firstDogId, secondDogId){
  return DBService.dbConnect().then(db => {
    db.collection("dog").findOneAndUpdate(
      {  _id: new mongo.ObjectID(firstDogId)} , 
      { $pull: { pendingLikesIds: secondDogId } },
      function(err, res) {
          if (err) throw new Error('Failed to delete like from user\'s dog');
          db.close();
        });
  });
}

// function  _deleteFromLikedDog(userDogId, likedId){
//   DBService.dbConnect().then(db => {
//     db.collection("dog").findOneAndUpdate(
//       {  _id: new mongo.ObjectID(likedId)} , 
//       { $pull: { pendingLikesIds: userDogId } },
//       function(err, res) {
//           if (err) throw new Error('Failed to delete like from user\'s dog');
//           db.close();
//         });
//   });
// }

function _addToMatches(userDogId, likedId, matchId){
    var addedMatchesPrms = [];
    addedMatchesPrms.push(_addMatchToDog(userDogId, matchId));
    addedMatchesPrms.push(_addMatchToDog(likedId, matchId));
    return Promise.all(addedMatchesPrms);
}


function _addMatchToDog(dogId, matchId){
  return DBService.dbConnect()
    .then(db => {
      return db
        .collection("dog")
        .findOneAndUpdate(
          { _id: new mongo.ObjectID(dogId) },
          { $push: { matches: {matchId, isRead: false} } },
          { returnOriginal: false }
        );
    })
}

// function _addMatchToUserDog(likedId, userDogId){
//   return DBService.dbConnect()
//     .then(db => {
//       return db
//         .collection("dog")
//         .findOneAndUpdate(
//           { _id: new mongo.ObjectID(userDogId) },
//           { $push: { matches: {likedId, isRead: false} } },
//           { returnOriginal: false }
//         );
//     })
// }

// function _addMatchToLikedDog(likedId, userDogId){
//   return DBService.dbConnect()
//   .then(db => {
//     return db
//       .collection("dog")
//       .findOneAndUpdate(
//         { _id: new mongo.ObjectID(likedId) },
//         { $push: { matches: {userDogId, isRead: false} } },
//         { returnOriginal: false }
//       );
//   })
// }

// function _createMatch(userId, likedDogUserId, userDogId, likedId) {
//   return new Promise((resolve, reject) => {
//     _addMatch(userId, likedDogUserId, userDogId, likedId)
//       .then(() => {
//         resolve();
//       })
//       .catch(err => {
//         reject(err);
//       });
//     // _addMatchToUserDog(likedId, userDogId);
//     // _addMatchToLikedDog(likedId, userDogId);
//     // if (err) reject(err);
//     // else resolve();
//   });
// }

function _addMatch(userId, likedDogUserId, userDogId, likedId) {
    var match = {
      firstLikerId: userId,
      secondLikerId: likedDogUserId,
      firstDogId: userDogId,
      secondDogId: likedId
    };

    return DBService.dbConnect().then(db => {
      return db.collection('match').insertOne(match)
      .then(res => {
        console.log('res.insertedId in _addMatch', res.ops[0]);
        
        return res.ops[0];
        // return res.insertedId;
      })

      // , function(err, match) {
      //   console.log("inside _addMatch");
      //   if (err) reject(err);
      //   else resolve();
      //   db.close();
      // });
    });
}

function getDogsLikes(userDogId) {
  var criteria = { pendingLikesIds: userDogId };
  console.log("criteria", criteria);

  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db
        .collection("dog")
        .find(criteria)
        .toArray((err, dogs) => {
          if (err) reject(err);
          else resolve(dogs);
          db.close();
        });
    });
  });
}

function _getMatchedDog(likedId, userDogId) {
  console.log("getMatchedDog");
  console.log({ likedId });
  var _id = new mongo.ObjectID(likedId);

  var criteria = { $and: [{ _id }, { pendingLikesIds: userDogId }] };

  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db.collection("dog").findOne(criteria, function(err, dog) {
        console.log("dog in getMatchedDog", dog);

        if (err) reject(err);
        // else if (dog === null) reject('No match yet...');
        // else {
        //   if(dog !== null)
        //   {
        //     // this.$socket.emit('newMatch', matchedDog);
        //     resolve(dog);
        //   } 
        // };
        else resolve(dog)
        db.close();
      });
    });
  });
}

module.exports = {
  getDogs,
  getById,
  deleteDog,
  updateDog,
  addDog,
  getNextDogs,
  uploadImg,
  addLike,
  getDogsLikes
  // getMatchedDog
};
