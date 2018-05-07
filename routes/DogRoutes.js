
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
  
  app.get(`${DOG_URL}/isMatch`, (req, res) => {
    const likedId = req.query.likedId;
    const userDogId = req.query.userDogId;

    console.log('likedId', likedId);
    console.log('userDogId', userDogId);
    

    DogService.getMatchedDog(likedId, userDogId)
    .then(dog => res.json(dog))
    .catch(err => res.status(500).send("Could not check match"));
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

  app.post(`${DOG_URL}/uploadImg`, (req, res) => {
    const imgUrl = req.body.imgUrl;
    DogService.uploadImg(imgUrl)
      .then(response => res.json({url: response.url}))
      .catch(err => res.status(500).send("Could not add image"));
  });

  app.post(`${DOG_URL}/like`, (req, res) => {
    const likedId = req.body.likedId;
    const userDogId = req.body.userDogId;
    const userId = req.body.userId;

    DogService.addLike(likedId, userDogId, userId)
    .then(matchId => res.json(matchId))
    .catch(err => res.status(500).send("Could not add liked dog"));
  });

  app.get(`${DOG_URL}/like/:userDogId`, (req, res) => {
    const userDogId = req.params.userDogId;
    DogService.getDogsLikes(userDogId)
      .then(dogs => {
        console.log('dogs', dogs);
        
        res.json(dogs);
      })
      .catch(err => res.status(500).send(err.message));
  });


};
