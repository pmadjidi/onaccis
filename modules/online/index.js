"use strict"
const crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;
let p2pUrl = "mongodb://localhost:27017/p2p"
let chUrl = "mongodb://localhost:27017/channel"
let sessUrl = "mongodb://localhost:27017/session"
let p2pDb = null
let chDb = null
let sessDb = null


MongoClient.connect(p2pUrl)
  .then(db=>{console.log("Connected to database p2p messages"); p2pDb = db})
  .catch(err=>console.log("Error Connecting to database " + p2pUrl + err))

MongoClient.connect(chUrl)
    .then(db=>{console.log("Connected to database channel messages"); chDb = db})
    .catch(err=>console.log("Error Connecting to database " + chUrl + err))

MongoClient.connect(sessUrl)
        .then(db=>{console.log("Connected to database session..."); sessDb = db})
        .catch(err=>console.log("Error Connecting to database  " + sessUrl + err))



let CLIENTS = []
let CINDEX = -1



function incIndex() {
  return ++CINDEX
}

function addConn(conn) {
  CLIENTS[conn.index] = conn
}

function rmConn(conn) {
  if (conn.index > -1) {
    console.log("Deleting client at index: ",conn.index);
    CLIENTS.splice(conn.index, 1)
    boradcastLogin()
  }
}

function onlineList(username) {
  if (username)  {
  let unique = []
  let users =   CLIENTS.filter(conn=>conn.state !== "closed")
  .map(conn=> {
    if((conn.username !== username || conn.username === null) && conn.state !== "closed" )
      return conn.username
  }).filter(name => name !== undefined)
  for (let i = 0; i < users.length; i++) {
      let current = users[i];
      if (unique.indexOf(current) < 0) unique.push(current);
  }
  return unique
}
  return []
}




function processOnline(message,conn) {
  let oList = onlineList(conn.username)
  console.log(oList)
  let payload = {type: "online",data: oList}
  send(payload,conn)
}

function boradcastLogin() {
  CLIENTS.filter(conn=>conn.state !== "closed" || conn.username === null || conn.username === undefined || conn === null)
  .forEach(conn=>{
      let oList = onlineList(conn.username)
      console.log("In BroadcastLogin");
      console.log(conn.username,oList)
      let payload = {type: "online",data: oList}
      send(payload,conn)
})
}




function processSignal(message,conn) {
  CLIENTS.filter(conn=>conn.state !== "closed" || conn.username === null || conn.username === undefined || conn === null)
    .forEach(conn=>{
      if (conn.username === message.targetUser) {
        let payload = {type: "signal",payload: message}
        send(payload,conn)
      }
    })
  }

  function _processMessageUser(message,conn) {
    console.log("_processMessage", message);
    CLIENTS.filter(conn=>conn.state !== "closed" || conn.username === null || conn.username === undefined || conn == null)
      .forEach(conn=>{
        if (conn.username === message.targetUser || conn.username === message.sourceUser ) {
          let payload = {type: "message",payload: message}
          // console.log(cl.username,payload);
        send(payload,conn)
        }
      })
    }

    function _processTypingUser(message,conn) {
      console.log("_processMessage", message);
      CLIENTS.filter(conn=>conn.state !== "closed" || conn.username === null || conn.username === undefined)
        .forEach(conn=>{
          if (conn.username === message.targetUser) {
            let payload = {type: "message",payload: message}
            // console.log(cl.username,payload);
          send(payload,conn)
          }
        })
      }


    function send(payload,conn) {
      let payloadString = JSON.stringify(payload)
      try {
        if (payloadString)
          conn.client.send(payloadString)
    } catch (err) {
      console.log(err,payload);
      console.log("Send: Payload String, ",payloadString);
    }
    }

      function _processMessageChannel(message,conn) {
        CLIENTS.filter(conn=>conn.state !== "closed")
        .forEach(cl=>{
              let payload = {type: "message",payload: message}
              send(payload,cl)
              console.log("Sendigng processMessage: ",payload)
          })
        }


      function _addMessageId(message){
        message.id = crypto.createHash('sha1').update(message.content).digest('hex')
      }

        function _addNotifyArray(message) {
          message.notifyed = new Array()
        }

      function _processTypingChannel(message,conn) {
        _processMessageChannel(message,conn)
      }

      function processMessage(message,conn) {
        let time = new Date().getTime()
        message.time = time
        let messageType = message.type


        if (messageType === "channel") {
            _addMessageId(message)
            _processMessageChannel(message,conn)
            _chStore(message)
          }
        else if (messageType === "P2P") {
          _addMessageId(message)
          _processMessageUser(message,conn)
            _p2pStore(message)
          }
        else if (messageType === "replayCH") {
                _playbackChannel(message,conn)
            //  _reply(message.payload,conn)
          }
        else if (messageType === "typingUser") {
                  _processTypingUser(message,conn)
            }
            else if (messageType === "typingChannel") {
                      _processTypingChannel(message,conn)
                }
                else if (messageType === "replayP2P") {
                          _playbackP2P(message,conn)
                    }


        else {
          console.log("Error processMessage, Unkown message type: ", message);
      }
    }

      function _p2pStore(payload) {
          _addNotifyArray(payload)
         p2pDb.collection("p2p").insert(payload)
      }

      function _chStore(payload) {
        chDb.collection("channel").insert(payload)
      }


      // {}
      function _playbackP2P(message,conn) {
         p2pDb.collection("p2p").find({$or: [{sourceUser: message.userName},{targetUser: message.userName}]},
           function(err, messageArray) {
   if (messageArray) {
     let timeStamp = new Date().getTime()
     messageArray.forEach(m=>{
       let payload = {type: m.type,sourceUser: m.sourceUser,targetUser: m.targetUser,content: m.content,time: m.time}
       payload.replay = timeStamp

       send({type: "message",payload: payload},conn)
       console.log(payload);
     })
   }
})
}


function _playbackChannel(message,conn) {
  console.log("GotPlayback Channel",message);
   chDb.collection("channel").find({targetChannel: message.channelName},
     function(err, messageArray) {
if (messageArray) {
let t = new Date().getTime()
messageArray.forEach(m=>{
 let payload = {type: m.type,sourceUser: m.sourceUser,targetChannel: m.targetChannel,content: m.content,time: m.time,id: m.id,replay: t}
 if (m.notifyed && m.notifyed.indexOf(conn.username) > -1) {
    payload.notifyed =  "X"
  }
 send({type: "message",payload: payload},conn)
 console.log(payload);
})
}
})
}


    module.exports = {
      processSignal,
      processMessage,
      boradcastLogin,
      processOnline,
      onlineList,
      addConn,
      rmConn,
      incIndex
    }
