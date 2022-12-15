
//some setup help from https://socket.io/get-started/chat
const express = require ('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname));

var users = [];

var numCharactersSelected = 0;

//send the html file
app.get('/', (req, res) => { 
    var path = url.parse(req.url).pathname;
    res.sendFile(__dirname + '/index.html');
    clientRes = res;
});
//allows us to use local files
app.use(express.static('public'));

class Character {
    constructor(name, movement, xPos, yPos) {
      this.position = [xPos, yPos];
      this.name = name;
      this.movement = movement;
    }
    
    toMsg()
    {
        return "|" + this.name + "," + this.movement + "," + this.position[0] + "," + this.position[1];
    }

    updatePos(newPos)
    {
      this.position = newPos;//indexToPos(newPos);
    }
  }

var p1Characters = [new Character("Wilton", 3, 0, 0), new Character("golly", 2, 1, 5) ];
var p2Characters = [new Character("Jack Skellington", 1, 4, 4), new Character("Lucifer", 2, 4, 5) ];

function charsToMsg(characters)
{
    var msg = "";
    for(var i = 0; i < characters.length; i++)
    {
        msg += characters[i].toMsg();
    }
    return msg;
}

function getInitMsg(p1Chars, p2Chars, num_rows, num_cols)
{
    return charsToMsg(p1Chars) + ";" + charsToMsg(p2Chars) + ";" + num_rows + "," + num_cols;
}

function moveCharacter(charName, newPos, playerNum)
{
  console.log("moving character " + charName);
  var chars = playerNum == 1 ? p1Characters : p2Characters;
  for(var i = 0; i < chars.length; i++)
  {
    if(chars[i].name === charName)
    {
      chars[i].updatePos(newPos);
      var msg = "Player [" + playerNum + "] moved (" + charName + ") to pos {" + newPos+ "}";
      console.log(msg);
     return true;
    }
  }
  
  return false;
}

io.on('connection', (socket) => {
    var addr = socket.id;
    users.push(addr);

    var initMsg = getInitMsg(p1Characters, p2Characters, 5, 5);
    console.log('User ' + users[0] + ' connected');
    socket.emit('init',  initMsg);

    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });
    
    socket.on('turn', (msg) => {
        var playerNum = msg.substring(
            msg.indexOf("[") + 1, 
            msg.lastIndexOf("]")
        );
        var index = msg.substring(
            msg.indexOf("{") + 1, 
            msg.lastIndexOf("}")
        );
        response = "Player [" + playerNum +"] pressed {" + index + "}";
        console.log("TURN: " +response);
        io.emit('turn', response);
    });

    socket.on('selectPlayer', (msg) => {
        var index = msg.substring(
            msg.indexOf("{") + 1, 
            msg.lastIndexOf("}")
        );
        response = "Somone selected player {" + index + "}";
        console.log("SELECT PLAYER: " + response);
        io.emit('selectPlayer', response);
        numCharactersSelected++;
        console.log("num characters selected: " + numCharactersSelected);
        if(numCharactersSelected >= 2)
            io.emit('START', "you can start the game");
    });
    socket.on('moveCharacter', (msg) => {
        var playerNum = msg.substring(
            msg.indexOf("[") + 1, 
            msg.lastIndexOf("]")
        );
        var charName = msg.substring(
            msg.indexOf("(") + 1, 
            msg.lastIndexOf(")")
        );
        var newPos = msg.substring(
            msg.indexOf("{") + 1, 
            msg.lastIndexOf("}")
        );
        var msg = "Player [" + playerNum + "] moved (" + charName + ") to pos {" + newPos+ "}";
        console.log("MOVE: " +msg);
        moveCharacter(charName, newPos, playerNum);
        io.emit('moveCharacter', msg);
    });
  });  


server.listen(3000, () => {
    console.log("Running on localhost:3000");
});