const UserService = require('./UserService.js');
const DogService = require('./DogService.js');
const MatchService = require('./MatchService.js');

var socketIo = require("socket.io");

var connectedCount = 0;
var allSockets = [];

function init(http) {
  const io = socketIo(http);
  io.on("connection", socket => {
    var user;
    var roomName;
    setTimeout(() => {
      console.log('before emit')
      io.emit('chenAviv')
      console.log('after emit')
      
    }, 1000)
    // socket.emit('chenAviv')

    socket.on('userLoggedIn', userDetails => {
      user = userDetails;
      socket.join(user._id)
      console.log('user was logged in and details are in socket:', user)
    })

    socket.on('likedDog', ({ dogId, userDogId, userId, dogUserId }) => {
      DogService.addLike(dogId, userDogId, userId)
      .then(match => {
        if (match) {
          io.to(dogUserId).emit('matched', match)
          socket.emit('matched', match)
        }
      })
    })

    socket.on('chatRequest', data => {
      socket.leave(roomName);
      roomName = data.roomName;
      socket.join(data.roomName);
      io.to(data.roomName).emit('newChatMember', data.username)
    })

    socket.on('newMsg', msg => {
      MatchService.addMsgToMatch(roomName, msg)
      .then(res => {
        io.to(roomName).emit('newMsg', {msg, matchId: roomName})
      })

      // socket.in(roomName).emit('newMsg', msg)
    })


    console.log("a user connected");
    connectedCount++;
    allSockets.push(socket);

    socket.on("disconnect", () => {
      console.log("user disconnected");
      connectedCount--;
      allSockets.splice(allSockets.findIndex(s => s === socket), 1);
    });
  });
}

module.exports = {
  init
};

// socket.on('chat newMessage', msg => {
//   console.log('message: ', msg);
//   if (socket.theTopic) {
//     console.log('Sending msg to all members in topic: ', socket.theTopic);
//     io.to(socket.theTopic).emit('chat message', msg);
//   } else {
//     io.emit('chat message', msg);
//   }
// });

// socket.on('chat setTopic', topic => {
//   console.log('Server setting the TOPIC', topic);
//   if (socket.theTopic) socket.leave(socket.theTopic);
//   socket.join(topic);
//   socket.theTopic = topic;

//   console.log('Connected Count', connectedCount, allSockets.length);
// })

// socket.on('chat sendStatus', statusTxt => {
//   console.log('Server sending  the STATUS', statusTxt);
//   socket.broadcast.emit('chat setStatusTxt', statusTxt);
// })
