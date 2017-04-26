"use strict"
const login = require('./modules/login/')
const online = require('./modules/online/')
const WebSocketServer = require('ws').Server,
  express = require('express'),
  https = require('https'),
  app = express(),
  fs = require('fs');

const pkey = fs.readFileSync('./ssl/key.pem'),
  pcert = fs.readFileSync('./ssl/cert.pem'),
  options = {key: pkey, cert: pcert, passphrase: '123456789'};
let wss = null, sslSrv = null

// use express static to deliver resources HTML, CSS, JS, etc)
// from the public folder
app.use(express.static('public'));

app.use(function(req, res, next) {
  if(req.headers['x-forwarded-proto']==='http') {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

// start server (listen on port 443 - SSL)
sslSrv = https.createServer(options, app).listen(443);
console.log((new Date()) + " The HTTPS server is up and running");

// create the WebSocket server
try {
wss = new WebSocketServer({server: sslSrv});
console.log((new Date()) + " WebSocket Secure server is up and running.");
} catch (err)
{
  console.log(err)
}


/** successful connection */
wss.on('connection', function (client) {
  let ip =  client._socket.remoteAddress
  let port = client._socket.remotePort
  console.log((new Date()) + " A new WebSocket client was connected.");
  console.log((new Date()) + ' New websocket connection from %s:%d', ip,port);
  /** incomming message */
  client.on('message', function (message) {
  console.log(new Date() + "Got message: " + ip + port + " " + message)
    /** broadcast message to all clients */
  //  wss.broadcast(message, client);
  processMessage(message,client)
  });

  client.on('close', function(reasonCode, description) {
      console.log(new Date() + "Client disconnect " + ip + port + " reason: " + reasonCode + " description: " + description)
      console.log("Removing session")
      console.log(client.onacciSession)
    });

});



function processMessage(message,client) {
  let m = JSON.parse(message)
  let auth = login.checkAuth(m,client)
  console.log("message auth status: ",auth)
  if (auth) {
  switch (m.type){
      case "login":
      login.process(m.payload,client)
      break
      case "signal":
      processSignal(m.payload,client)
      break
      case "online":
      processOnline(m.payload,client)
      break
      default:
        console.log("Undefined message type: ", m)
  }
}
else {
  console.log("Sending auth: false message to: ", client.onacciSession.user);
  client.send(JSON.stringify({auth: "false", user: client.onacciSession.user}))
}
}

function processOnline(message,client) {
  let userList = []
  //console.log("clients",wss.client)
  console.log("number of clients",wss.client.length)
  return client.send(JSON.stringify({online: []}))

  var i = 0, n = wss.clients ? wss.clients.length : 0, client = null;
  for (; i < n; i++) {
    client = wss.clients[i];
    // don't send the message to the sender...
    if (client === exclude) continue;
    if (client.readyState === client.OPEN) client.send(data);
  if (n < 1)
    client.send(JSON.stringify({online: false}))

  userList = wss.clients.map(conn => conn.onacciSession.username)
  client.send(JSON.stringify({online: userList}))

}
}


// broadcasting the message to all WebSocket clients.
wss.broadcast = function (data, exclude) {
  var i = 0, n = this.clients ? this.clients.length : 0, client = null;
  if (n < 1) return;
  console.log("Broadcasting message to all " + n + " WebSocket clients.");
  for (; i < n; i++) {
    client = this.clients[i];
    // don't send the message to the sender...
    if (client === exclude) continue;
    if (client.readyState === client.OPEN) client.send(data);
    else console.error('Error: the client state is ' + client.readyState);
  }
};
