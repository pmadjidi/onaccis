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
  conn.client.send(JSON.stringify({type: "online",data: oList}))
}

function boradcastLogin() {
  CLIENTS.forEach(cl=>{
      let oList = onlineList(cl.username)
      console.log("In BroadcastLogin");
      console.log(cl.username,oList)
      try {
      cl.client.send(JSON.stringify({type: "online",data: oList}))
    } catch (err) {
      console.log("Error: ",err)
      }
})
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

  function processMessage(message,conn) {
    CLIENTS.forEach(cl=>{
        if (cl.username === message.targetUser) {
          let payload = JSON.stringify({type: "message",payload: message})
          cl.client.send(payload)
          console.log("Sendigng processMessage: ",payload)
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
