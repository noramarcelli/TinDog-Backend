
var DogService = require("../services/DogService");
var DOG_URL = "/dog";

module.exports = app => {
  app.get(DOG_URL, (req, res) => {
    DogService.getDogs()
      .then(dogs => {
        res.json(dogs);
      })
      .catch(err => res.status(500).send(err.message));
  });

  app.get(`${DOG_URL}/next`, (req, res) => {
    const prevId = req.query.prevId;
    const userDogId = req.query.userDogId;
    DogService.getNextDogs(prevId, userDogId)
    .then(dog => {
      res.json(dog);
    })
    .catch(err => res.status(500).send(err.message));
  });
  
  app.get(`${DOG_URL}/:dogId`, (req, res) => {
    const dogId = req.params.dogId;
    DogService.getById(dogId)
      .then(dog => {
        res.json(dog);
      })
      .catch(err => res.status(500).send(err.message));
  });

  app.delete(`${DOG_URL}/:dogId`, (req, res) => {
    const dogId = req.params.dogId;
    if (!dogId) {
      res.status(500).send("Missing DogID to delete");
    }
    DogService.deleteDog(dogId)
      .then(_ => res.end())
      .catch(err => res.status(500).send("Could not delete dog"));
  });

  app.post(DOG_URL, (req, res) => {
    console.log('inside post');
    const dog = req.body;
    DogService.addDog(dog)
      .then(dog => res.json(dog))
      .catch(err => res.status(500).send("Could not add dog"));
  });

  app.put(`${DOG_URL}/:dogId`, (req, res) => {
    const dogId = req.params.dogId;
    const dog = req.body;
    dog._id = dogId;
    DogService.updateDog(dog)
      .then(dog => res.json(dog))
      .catch(err => res.status(500).send("Could not update dog"));
  });
};
