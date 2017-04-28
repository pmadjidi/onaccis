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
  notifyClientsOnline(client)
  /** incomming message */
  client.on('message', function (message) {
  console.log(new Date() + "Got message: " + ip + port + " " + message)
  processMessage(message,client)
  });



  client.on('close', function(reasonCode, description) {
      console.log(new Date() + "Client disconnect " + ip + port + " reason: " + reasonCode + " description: " + description)
      this.client.onacciSession.status = false
    });
});

function notifyClientsOnline(client){
  CLIENTS.push(client)
//  CLIENTS.map(cl=>processOnline({},cl))
}


function pruneDeadSessions() {
  CLIENTS = CLIENTS.map(cl=>
    if (cl.onacciSession && cl.onacciSession.status !== deleted )
      return cl
    else {
        console.log("deleting dead session",JSON.stringify(cl.onacciSession,null,4))
    }
}

setInterval(pruneDeadSessions,30*1000)





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
  console.log("Sending auth: false message to: ", client.onacciSession.username);
  client.send(JSON.stringify({auth: "false", user: client.onacciSession.username}))
}
}

function onlineList() {
  let userList = CLIENTS.map(cl=>{
    if (cl && cl.onacciSession &&  cl.onacciSession.username && cl.onacciSession.status !== false)
        return cl.onacciSession.username
  })
  console.log(userList)
  userList = userList.filter(item=> item != null && item != undefined)
  console.log(userList)
  return userList
}

function processOnline(message,client) {
  client.send(JSON.stringify({type: "online",data: onlineList()}))
}

function processSignal(message,client) {
  CLIENTS.forEach(cl=>{
    if (cl && cl.onacciSession) {
      let clientName =  cl.onacciSession.username
      if (clientName === message.targetUser)
      cl.send(JSON.stringify({type: "signal",payload: message}))
    }
  })

  /*
  { candidate:
   { candidate: 'candidate:676152799 1 tcp 1518280447 130.237.31.162 9 typ host tcptype active generation 0 ufrag V+by network-id 1',
     sdpMid: 'video',
     sdpMLineIndex: 1 },
  targetUser: 'payam' }
  */
}


/*
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
*/
