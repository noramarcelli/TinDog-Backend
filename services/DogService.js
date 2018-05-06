const mongo = require('mongodb');
const DBService = require('./DBService');
var cloudinary = require('cloudinary');
var MongoClient = mongo.MongoClient;
var cloudinaryIsInit = false;

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
            db.collection('dog').find(criteria).limit(2).toArray( (err, dogs) => {
                if (err)    reject(err)
                else        resolve(dogs);
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

function uploadImg(imgUrl) {
    _initCloudinary();

    return new Promise((resolve, reject)=>{
    cloudinary.v2.uploader.upload(imgUrl, (err, res) => {
        console.log('res', res);
        if (err)    reject(err)
        else        resolve(res);
    });
   });
}

function _initCloudinary(){
    if(!cloudinaryIsInit) {
        cloudinary.config({
            cloud_name: 'ilanamost',
            api_key: '126843244928435',
            api_secret: 'Pn9z1wRYWbHXb_lAX_zM5QTAUJY'
        });
        cloudinaryIsInit = true;
    }
}

function addLike(likedId, userDogId){
    return new Promise((resolve, reject)=>{
        DBService.dbConnect()
        .then(db=>{
            // db.collection('dog').insert(likedId, function (err, res) {
            //     if (err)    reject(err)
            //     else        resolve(likedId);
            //     // else        resolve(res.ops[0]);
            //     db.close();
            // });

            db.collection('dog').findOneAndUpdate(
                { _id: userDogId },
                { $push: { pendingLikesIds: likedId } },
                { new: true },

                function (err, documents) {
                            res.send({ error: err, affected: documents });
                            console.log('documents', documents);
                            
                            if (err)    reject(err)
                            else        resolve(documents);
                            db.close();
                }
        )

        // collection.findOneAndUpdate(
        //     { "code": req.body.code },
        //     { $set: req.body.updatedFields },
        //     { new: true },
        //     function (err, documents) {
        //         res.send({ error: err, affected: documents });
        //         db.close();
        //     }
        // );
    });
})}

// db.students.update(
//     { _id: 1 },
//     { $push: { scores: 89 } }
//  )


module.exports = {
    getDogs,
    getById,
    deleteDog,
    updateDog,
    addDog,
    getNextDogs,
    uploadImg,
    addLike
}
