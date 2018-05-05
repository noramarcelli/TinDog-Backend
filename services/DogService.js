const mongo = require('mongodb');
const DBService = require('./DBService');

var MongoClient = mongo.MongoClient;

function getDogs() {
    return new Promise((resolve, reject)=>{
        DBService.dbConnect()
        .then(db=>{
            db.collection('dog').find({}).toArray((err, dogs) => {
                if (err)    reject(err)
                else        resolve( dogs );
                db.close();
            });
        })
    });
    
}

function getById(dogId) {
    dogId = new mongo.ObjectID(dogId);
    return new Promise((resolve, reject)=>{
        DBService.dbConnect()
        .then(db=>{
            db.collection('dog').findOne({_id: dogId}, function (err, dog) {
                if (err)    reject(err)
                else        resolve(dog);
                db.close();
            });
        })
    });
}


function getNextDogs(prevId, userDogId){
    console.log({prevId})
    var criteria = {}
    if (prevId) criteria._id = {  $gt: new mongo.ObjectID(prevId) ,  $ne: new mongo.ObjectID(userDogId)}
    else criteria._id = { $ne: new mongo.ObjectID(userDogId) }
    return new Promise((resolve, reject)=>{
        DBService.dbConnect()
        .then(db=>{
            db.collection('dog').find(criteria).limit(2).toArray( (err, dog) => {
                if (err)    reject(err)
                else        resolve(dog);
                db.close();
            });
        })
    });
}


function deleteDog(dogId) {
    dogId = new mongo.ObjectID(dogId);
    return new Promise((resolve, reject)=>{
        DBService.dbConnect()
        .then(db=>{
            db.collection('dog').deleteOne({_id: dogId}, function (err, res) {
                if (err)    reject(err)
                else        resolve();
                db.close();
            });
        })
    });
}

function addDog(dog) {
    return new Promise((resolve, reject)=>{
        DBService.dbConnect()
        .then(db=>{
            db.collection('dog').insert(dog, function (err, res) {
                if (err)    reject(err)
                else        resolve(res.ops[0]);
                db.close();
            });
        })
    });
}
function updateDog(dog) {
    dog._id = new mongo.ObjectID(dog._id);

    return new Promise((resolve, reject)=>{
        DBService.dbConnect()
        .then(db=>{
            db.collection('dog').updateOne({_id : dog._id}, dog, function (err, updatedDog) {
                if (err)    reject(err)
                else        resolve(updatedDog);
                db.close();
            });
        })
    });
}


module.exports = {
    getDogs,
    getById,
    deleteDog,
    updateDog,
    addDog,
    getNextDogs
}
