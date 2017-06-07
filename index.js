"use strict"
const login = require('./modules/login/')
const online = require('./modules/online/')
const channels = require('./modules/channels/')
const icon = require('./modules/icon/')
const assets = require('./modules/assets/')
const sessions = require('./modules/sessions/')
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
  conn.username = null
  console.log((new Date()) + " A new WebSocket client was connected: ",conn.index);
  printConn(conn)
  online.addConn(conn)

  client.onmessage = function (evt) {
      routeMessage(evt.data,conn)
    }

  }



  client.on('close', function(reasonCode, description) {
      console.log(new Date() + "Client disconnect " + conn.ip + conn.port + " reason: " + reasonCode + " description: " + description)
      conn.state = "closed"
      online.boradcastLogin()
      //online.rmConn(conn)
    });

    client.on('error', function(error) {
        console.log(new Date() + "Client in error state " + error)
      //  online.rmConn(conn)
      });


});


function printConn(conn){
  console.log("IP: ",conn.ip)
  console.log("Port: ",conn.port)
  console.log("Auth: ",conn.auth)
  console.log("index: ",conn.index)
  console.log("Username: ",conn.username);
}


function routeMessage(message,conn) {
  let m
  try {
  m = JSON.parse(message)
} catch (err) {
  console.log(err)
  return
}
  console.log(JSON.stringify(m,null,4))
  let session = m.payload.session

  if (conn.auth || session) {
  switch (m.type){
      case "signal":
      online.processSignal(m.payload,conn)
      break
      case "online":
      online.processOnline(m.payload,conn)
      break
      case "channels":
      channels.getUserChannels(m.payload,conn)
      break
      case "createchannel":
      channels.initChannel(m.payload,conn)
      break
      case "whoAmI":
      processWhoAmI(m.payload,conn)
      break
      case "message":
      online.processMessage(m.payload,conn)
      break
      case "session":
      sessions.processSession(m.payload,conn)
      break
      case "seen":
      channels.channelNotifyedMessage(m.payload,conn)
      break
      case "avatar":
      icon.processAvatar(m.payload,conn)
      break
      case "assets":
      assets.processAsset(m.payload,conn)
      break
      default:
        console.log("Undefined message type: ", m)
  }
}
else {
  if (m.type !== "login" ) {
    console.log("unauthenticated, redirecting to login.....", conn.username);
    return conn.client.send(JSON.stringify({type: "auth",auth: "false", user: conn.username}))
  }

  console.log("Processing login.....",JSON.stringify(m.payload,null,4))
  return login.process(m.payload,conn,online.boradcastLogin)
}
}



function processWhoAmI(message,conn) {
  conn.client.send(JSON.stringify({type: "whoAmIAns",
    payload: {session: conn.session,username: conn.username,team: conn.team}
  }))
}
