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
function deleteDog(dogId) {
    toyId = new mongo.ObjectID(dogId);
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
            db.collection('Dog').insert(dog, function (err, res) {
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
            db.collection('dog').updateOne({_id : dog._id}, toy, function (err, updatedDog) {
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
    addDog
}
