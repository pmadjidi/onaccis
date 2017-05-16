"use strict"

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
  let users =   CLIENTS.map(conn=> {
    if(conn.username !== username || conn.username === undefined)
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
  CLIENTS.forEach(conn=>{
      let oList = onlineList(conn.username)
      console.log("In BroadcastLogin");
      console.log(conn.username,oList)
      let payload = {type: "online",data: oList}
      send(payload,conn)
})
}




function processSignal(message,conn) {
  CLIENTS.forEach(conn=>{
      if (conn.username === message.targetUser) {
        let payload = {type: "signal",payload: message}
        send(payload,conn)
      }
    })
  }

  function _processMessageUser(message,conn) {
    console.log("_processMessage", message);
    CLIENTS.forEach(conn=>{
        if (conn.username === message.targetUser || conn.username === message.sourceUser ) {
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
        CLIENTS.forEach(cl=>{
              let payload = {type: "message",payload: message}
              send(payload,cl)
              console.log("Sendigng processMessage: ",payload)
          })
        }

      function processMessage(message,conn) {
        let time = new Date().getTime()
        message.time = time
        let messageType = message.messageT
        if (messageType == "channel")
            _processMessageChannel(message,conn)
        if (messageType == "P2P")
            _processMessageUser(message,conn)
        else
          console.log("Error processMessage, Unkown message type: ", messageType);
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
