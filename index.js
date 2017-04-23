const WebSocketServer = require('ws').Server,
  express = require('express'),
  https = require('https'),
  app = express(),
  fs = require('fs');

const pkey = fs.readFileSync('./ssl/key.pem'),
  pcert = fs.readFileSync('./ssl/cert.pem'),
  options = {key: pkey, cert: pcert, passphrase: '123456789'};
var wss = null, sslSrv = null;

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
  console.log((new Date()) + " A new WebSocket client was connected.");
  console.log((new Date()) + ' New websocket connection from %s:%d', client._socket.remoteAddress,client._socket.remotePort);
  /** incomming message */
  client.on('message', function (message) {
  console.log("Got message: " + message)
    /** broadcast message to all clients */
  //  wss.broadcast(message, client);
  processMessage(message,client)
  });

  client.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + client._socket.remoteAddress + ' disconnected.');
    });

});

function processMessage(message,client) {
  let m = JSON.parse(message)
  switch (m.type){
      case "login":
      processLogin(message,client)
      break
      case "signal":
      processSignal(message,client)
      break
      default:
        console.log("Undefined message type: ", m)
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
