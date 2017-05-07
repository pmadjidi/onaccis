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
sslSrv = https.createServer(options, app).listen(9000);
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
wss.on('connection', client => {
  let conn = {}
  conn.ip =  client._socket.remoteAddress
  conn.port = client._socket.remotePort
  conn.client = client
  conn.auth = false
  conn.index = online.incIndex()
  console.log((new Date()) + " A new WebSocket client was connected.");
  printConn(conn)
  online.addConn(conn)


  client.on('message', function (message) {
  console.log(new Date() + "Got message: " + conn.ip + conn.port + " " + message)
  return processMessage(message,conn)
  });

  client.on('close', function(reasonCode, description) {
      console.log(new Date() + "Client disconnect " + conn.ip + conn.port + " reason: " + reasonCode + " description: " + description)
      online.rmConn(conn)
    });
});


function printConn(conn){
  console.log("IP: ",conn.ip)
  console.log("Port: ",conn.port)
  console.log("Auth: ",conn.auth)
  console.log("index: ",conn.index)
  console.log("Username: ",conn.username);
}


function processMessage(message,conn) {
  let m = JSON.parse(message)
  if (m.type === "login"){
    return login.process(m.payload,conn)
  }

  if (conn.auth) {
  switch (m.type){
      case "signal":
      return online.processSignal(m.payload,conn)
      break
      case "online":
      return online.processOnline(m.payload,conn)
      break
      case "whoAmI":
      return processWhoAmI(m.payload,conn)
      break
      default:
        console.log("Undefined message type: ", m)
  }
}
else {
  console.log("Sending auth: false message to: ", conn.username);
  conn.client.send(JSON.stringify({auth: "false", user: conn.username}))
}
}


function processWhoAmI(message,conn) {
  conn.client.send(JSON.stringify({type: "whoAmIAns",
    payload: {session: conn.session,username: conn.username}
  }))
}
