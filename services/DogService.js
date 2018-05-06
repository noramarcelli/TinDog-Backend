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
        _getMatchedDog(likedId, userDogId).then(matchedDog => {
          _createMatch(userId, matchedDog.userId, userDogId, likedId).then(
            () => {
              // return res.value;
              console.log(' _createMatch');
              
            }
          );
          // return res.value;
          // }).then(() => {
          //   // return res.value;
        });
        return res.value;
      }
      throw new Error("could not update dog");
    });
}

function _createMatch(userId, likedDogUserId, userDogId, likedId) {
  return new Promise((resolve, reject) => {
    _addMatch(userId, likedDogUserId, userDogId, likedId)
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
    // _addMatchToUserDog(likedId, userDogId);
    // _addMatchToLikedDog(likedId, userDogId);
    // if (err) reject(err);
    // else resolve();
  });
}

function _addMatch(userId, likedDogUserId, userDogId, likedId) {
  return new Promise((resolve, reject) => {
    var match = {
      firstLikerId: userId,
      secondLikerId: likedDogUserId,
      firstDogId: userDogId,
      secondDogId: likedId
    };

    DBService.dbConnect().then(db => {
      db.collection("match").insert(match, function(err, res) {
        console.log("inside _addMatch");
        if (err) reject(err);
        else resolve();
        db.close();
      });
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
  // getMatchedDog
};
