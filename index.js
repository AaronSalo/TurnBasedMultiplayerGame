
//some setup help from https://socket.io/get-started/chat
const express = require ('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname));

var users = [];

var NUM_ROWS = 5;

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
      this.position = posToIndex([xPos, yPos]);
      this.name = name;
      this.movement = movement;
      this.alive = true;
    }
    
    toMsg()
    {
        return "|" + this.name + "," + this.movement + "," + this.position;
    }

    updatePos(newPos)
    {
      this.position = newPos;//indexToPos(newPos);
    }
  }

  function posToIndex(pos) {
    var y = pos[1] == 0 ? 0 : pos[1] -1;

    return ((pos[0]  * NUM_ROWS) + y).toString();
  }

var p1Characters = [new Character("Wilton", 1, 0, 0), new Character("Golly", 3, 1, 5) ];
var p2Characters = [new Character("Jack", 1, 4, 4), new Character("Bill", 2, 4, 5) ,new Character("Peter", 1, 3, 5)  ];

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

    var initMsg = getInitMsg(p1Characters, p2Characters, NUM_ROWS, NUM_ROWS);
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
        var char = checkIfTakes(playerNum, newPos);

        if(char != null)
        {
            char.alive = false;
            io.emit("KILL", char.name);
            var winner = isGameOver();
            if( winner > 0)
                io.emit("WINNER", winner); 
            
        }
        console.log("MOVE: " +msg);
        moveCharacter(charName, newPos, playerNum);
        io.emit('moveCharacter', msg);
    });
  });  
  

  function checkIfTakes(playerNum, pos)
  {
    var chars = playerNum == 1 ? p2Characters : p1Characters; //get the other characters players

    for( var i = 0; i < chars.length; i++)
    {
      if(chars[i].position == pos)
        return chars[i];
    }
    return null;
  }

  function isGameOver()
  {
    var p1HasAlive = false;
    var p2HasAlive = false;
    for(var i = 0 ; i < p1Characters.length; i++)
    {
        if(p1Characters[i].alive)
        {
            p1HasAlive = true;
            break;
        }
    }
    for(var i = 0 ; i < p2Characters.length; i++)
    {
        if(p2Characters[i].alive)
        {
            p2HasAlive = true;
            break;
        }
    }

    if(!p1HasAlive)
        return 2; //p2 wins
    if(!p2HasAlive)
        return 1; //p1 wins
    return -1; //noone wins
  }

server.listen(3000, () => {
    console.log("Running on localhost:3000");
});