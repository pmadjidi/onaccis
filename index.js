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
let CLIENTS = []
let CINDEX = -1

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
  conn.index = ++CINDEX
  console.log((new Date()) + " A new WebSocket client was connected.");
  printConn(conn)
  CLIENTS[conn.index] = conn

  client.on('message', function (message) {
  console.log(new Date() + "Got message: " + conn.ip + conn.port + " " + message)
  return processMessage(message,conn)
  });

  client.on('close', function(reasonCode, description) {
      console.log(new Date() + "Client disconnect " + conn.ip + conn.port + " reason: " + reasonCode + " description: " + description)
      if (conn.index > -1) {
        console.log("Deleting client at index: ",conn.index);
        CLIENTS.splice(conn.index, 1);
      }
    });
});


function printConn(conn){
  console.log("\nIP: ",conn.ip)
  console.log("\nPort: ",conn.port)
  console.log("\nAuth: ",conn.auth)
  console.log("\nindex: ",conn.index)
}


function processMessage(message,conn) {
  let m = JSON.parse(message)
  if (m.type === "login"){
    return login.process(m.payload,conn)
  }

  if (conn.auth) {
  switch (m.type){
      case "signal":
      return processSignal(m.payload,conn)
      break
      case "online":
      return processOnline(m.payload,conn)
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

function onlineList(username) {
  return  CLIENTS.map(cl=> {
    if(cl.username !== username)
      return cl.username
  }).filter(name=>(name !== undefined || name !== null))
}

function processOnline(message,conn) {
  conn.client.send(JSON.stringify({type: "online",data: onlineList(conn.username)}))
}

function processSignal(message,conn) {
  CLIENTS.forEach(cl=>{
      if (cl.username === message.targetUser) {
        let payload = JSON.stringify({type: "signal",payload: message})
        cl.client.send(payload)
        console.log("Sendigng processSignal: ",payload)
      }
    })
  }
