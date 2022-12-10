
//some setup help from https://socket.io/get-started/chat
const express = require ('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname));

var users = [];

var clientRes;

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
  }

var p1Characters = [new Character("Wilton", 3, 0, 0), new Character("golly", 2, 1, 5) ];//[NUM_ROWS-1, 0];

function charsToMsg(characters)
{
    var msg = "";
    for(var i = 0; i < characters.length; i++)
    {
        msg += characters[i].toMsg();
    }
    msg += ";";
    return msg;
}

function getInitMsg(characters, num_rows, num_cols)
{
    return charsToMsg(characters) + num_rows + "," + num_cols;
}

io.on('connection', (socket) => {
    var addr = socket.id;
    users.push(addr);

    var initMsg = getInitMsg(p1Characters, 5, 5);
    console.log('User ' + users[0] + ' connected');
    socket.emit('init',  initMsg);

    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });
    
    socket.on('turn', (msg) => {
        console.log('user taking a turn');
        var index = msg.substring(
            msg.indexOf("{") + 1, 
            msg.lastIndexOf("}")
        );
        response = "user select " + index;
        console.log("On cell " + index);
        io.emit('turn', response);
    });
  });  


server.listen(3000, () => {
    console.log("Running on *:3000");
});