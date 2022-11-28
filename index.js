
// some setup help from https://socket.io/get-started/chat
const express = require ('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//base get request listener
app.get('/', (req, res) => { 
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('a user disconnected');
    });
    
    socket.on('turn', (msg) => {
        console.log('user taking a turn');
        io.emit('turn', msg);
    });
  });  

server.listen(3000, () => {
    console.log("Running on *:3000");
});