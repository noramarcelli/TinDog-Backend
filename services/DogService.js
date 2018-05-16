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
  var criteria = {
    _id: { $ne: new mongo.ObjectId(userDogId) }
  };
  if (prevId) criteria._id.$gt = new mongo.ObjectId(prevId);
  return getById(userDogId)
    .then(dog => {
      criteria.gender = {$ne: dog.gender};

      var matchedDogIds = [];
      if (dog.matches) {
        matchedDogIds = dog.matches.map(({ match }) => {
          let matchedDogId =
            match.firstDogId !== dog._id + '' ? match.firstDogId : match.secondDogId;
          return new mongo.ObjectId(matchedDogId);
        });
      }
      return matchedDogIds;
    })
    .then(matchedDogIds => {
      criteria._id.$nin = matchedDogIds;
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        DBService.dbConnect().then(db => {
          db
            .collection("dog")
            .find(criteria)
            .limit(2)
            .toArray((err, dogs) => {
              // console.log({ dogsInideToatt: dogs });
              if (err) reject(err);
              else resolve(dogs);
              db.close();
            });
        });
      });
    });
}



function deleteDog(dogId) {
  // dogId = new mongo.ObjectID(dogId);
  dogId = dogId;
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
  // dog._id = dog._id;

  // console.log('inside updateDog backend');
  // console.log('dog._id', dog._id);
  // console.log('dog', dog);
  

  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db
        .collection("dog")
        .updateOne({ _id: dog._id }, dog, function(err, updatedDog) {
          // console.log('updatedDog', updatedDog);
          // console.log('err', err);
          
          
          if (err) reject(err);
          else resolve(updatedDog);
          db.close();
        });
    });
  });
}

function uploadImg(imgUrl) {
  // console.log('uploadImg inside backend service');
  _initCloudinary();

  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(imgUrl, (err, res) => {
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

function addLike(likedId, userDogId, userId) {
  // var creteria = { $in: [likedId, pendingLikesIds] };

  return DBService.dbConnect()
    .then(db => {
      return db.collection("dog").findOneAndUpdate(
        { _id: new mongo.ObjectID(userDogId), pendingLikesIds: { $nin: [likedId] } },
        // { _id: userDogId },
        // { $push: { pendingLikesIds: likedId } },
        // { $nin: [likedId, pendingLikesIds] },
        { $push: { pendingLikesIds: likedId } },
        { returnOriginal: false }
      );
    })
    .then(res => {
      if (res.value) {
        // return _getMatchedDog(likedId, userDogId)
        return _getMatchedDog(likedId, userDogId).then(matchedDog => {
          if (!matchedDog) return;
          console.log(
            "matchedDog in _getMatchedDog promise result",
            matchedDog
          );

          // this.$socket.emit('newMatch', matchedDog);

          return _createMatch(userId, matchedDog.userId, userDogId, likedId)
            .then(match => {
              // this.$socket.emit('newMatch', matchedDog);
              return match;
            })
            .catch(err => {
              reject(err);
            });
        });
        // return res.value;
      } else {
        console.log({ res });
        throw new Error("could not update dog");
      }
    });
}

function _createMatch(userId, likedDogUserId, userDogId, likedId) {
  return _addMatch(userId, likedDogUserId, userDogId, likedId).then(match => {
    // console.log('matchId in createMatch', matchId);

    return _addToMatches(userDogId, likedId, match)
      .then(() => {
        return _deleteFromLikes(userDogId, likedId);
      })
      .then(() => match);
  });
}

function _deleteFromLikes(userDogId, likedId) {
  var deleteLikePrms = [];
  deleteLikePrms.push(_deleteFromDog(userDogId, likedId));
  deleteLikePrms.push(_deleteFromDog(likedId, userDogId));
  return Promise.all(deleteLikePrms);
}

function _deleteFromDog(firstDogId, secondDogId) {
  return DBService.dbConnect().then(db => {
    db.collection("dog").findOneAndUpdate(
      {  _id: new mongo.ObjectID(firstDogId)} ,
      { $pull: { pendingLikesIds: secondDogId } },
      function(err, res) {
        if (err) throw new Error("Failed to delete like from user's dog");
        db.close();
      }
    );
  });
}

function _addToMatches(userDogId, likedId, match) {
  var addedMatchesPrms = [];
  addedMatchesPrms.push(_addMatchToDog(userDogId, match));
  addedMatchesPrms.push(_addMatchToDog(likedId, match));
  return Promise.all(addedMatchesPrms);
}

function _addMatchToDog(dogId, match) {
  return DBService.dbConnect().then(db => {
    return db.collection("dog").findOneAndUpdate(
      { _id: new mongo.ObjectID(dogId) },
      // { _id: dogId },
      { $push: { matches: { match, isRead: false } } },
      { returnOriginal: false }
    );
  });
}

function _addMatch(userId, likedDogUserId, userDogId, likedId) {
  var match = {
    firstLikerId: userId,
    secondLikerId: likedDogUserId,
    firstDogId: userDogId,
    secondDogId: likedId,
    messages: []
  };

  return DBService.dbConnect().then(db => {
    return db
      .collection("match")
      .insertOne(match)
      .then(res => {
        console.log("res.insertedId in _addMatch", res.ops[0]);
        return res.ops[0];
      });
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
  // var _id = likedId;

  var criteria = { $and: [{ _id }, { pendingLikesIds: userDogId }] };

  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db.collection("dog").findOne(criteria, function(err, dog) {
        console.log("dog in getMatchedDog", dog);

        if (err) reject(err);
        else resolve(dog);
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
};
