const mongo = require('mongodb');
var DBService = require('./DBService');

module.exports.checkLogin = user => {
  return new Promise((resolve, reject) => {
    DBService.dbConnect().then(db => {
      db
        .collection('user')
        .findOne({ name: user.name, password: user.password }, function(
          err,
          userFromDB
        ) {
          if (err) reject(err)
          else resolve(userFromDB)
          db.close();
        });
    });
  });
};

module.exports.getUserById = userId => {
  console.log('inside getUserById in UserService');
  return new Promise((resolve, reject) => {
    console.log('userId in getUserById', userId);

    var _id = new mongo.ObjectID(userId);
    
    
    DBService.dbConnect().then(db => {
      db
        .collection('user')
        .findOne({ _id }, function(
          err,
          userFromDB
        ) {
          if (err){
            console.log('err', err);
            reject(err)
          } 
          else{
            console.log('userFromDB', userFromDB);
            resolve(userFromDB)
          }
          db.close();
        });
    });
  });
};

module.exports.addUser = user => {
  return new Promise((resolve, reject) => {
    // let isValidate = validateDetails(user);
    // if (!isValidate) reject('Validate failed!');
    DBService.dbConnect().then(db => {
      db
        .collection('user')
        .findOne({ name: user.name }, function(err, userFromDB) {
          // If name is already used!
          if (userFromDB) {
            reject('Name is already used!');
            db.close();
          } else {
            user.dogId = "";
            db.collection('user').insert(user, (err, res) => {
              console.log('res.ops after user insert: ', res.ops);
              console.log('res.ops[0]._id after user insert: ', res.ops[0]._id);
              if (err) reject(err);
              else {
                var userId = res.ops[0]._id + "";

                var dog = {
                  name: "",
                  imgs: [],
                  breed: "",
                  age: "",
                  description: "",
                  gender: "",
                  favs: [],
                  weight: "",
                  city: "",
                  userId: userId,
                  pendingLikesIds: [],
                  matches: []
                }
               return db.collection('dog').insertOne(dog).then(res => {
                  // console.log(' res.ops dog after user register', res.ops );
                   var dogId = res.ops[0]._id + "";
                   return dogId;
               }).then((dogId) => {
                user.dogId = dogId;
                // console.log('user', user);

               userId = new mongo.ObjectID(userId);
              //  console.log('userId',  userId);
                
                db.collection('user').updateOne({ _id: userId }, user, function(err, updatedUser) {
                  // console.log('updatedUser after user register', updatedUser.result );
                  if (err){ 
                    // console.log('err', err);
                    reject(err)
                  }
                  else  resolve(updatedUser.result);
                });
               })
                resolve(res.ops);
              }
              db.close();
            });
          }
        });
    });
  });
};
