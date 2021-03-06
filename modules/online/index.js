"use strict"
const crypto = require('crypto');
const db = require('../db/')
const USERS = require('../users/')
let sessUrl = db.db2Url("session")
let chUrl = db.db2Url("channel")
let p2pUrl = db.db2Url("p2p")
let chMetaUrl = db.db2Url("chmeta")
let channelUrl = db.db2Url("channel")


let CLIENTS = []
let CINDEX = -1


function findChannelsTeam(aTeam) {
  console.log("findChannelsTeam:",aTeam)
  return db.getData({team: aTeam},chMetaUrl,"chmeta")
}

function getUserChannels(channelName,conn) {
  return  findChannelsTeam(conn.team)
  .then(channels=>{return countNotificationsChannel(channels,conn)})
  .then(array=>conn.client.send(JSON.stringify({type: "channels",data: array})))
}

function countNotificationsChannel(channelArray,conn) {
  return Promise.all(channelArray.map(aChannel=>{
    return db.getData({"targetChannel": aChannel.name,team: conn.team,notifyed: {$nin: [conn.username]}},channelUrl,"channel")
    .then(array=>{
      let payload
      payload = {name: aChannel.name,symb: aChannel.symb,purpuse: aChannel.purpuse,notify: 0}
      if (array)
        payload.notify = array.length
      console.log(payload);
      return payload
    })}))
  }


  function countNotificationsUser(userArray,conn) {
    console.log("countNotificationsUser",userArray);
    return Promise.all(userArray.map(aUser=>{
      return db.getData({targetUser: conn.username,sourceUser: aUser.username,team: conn.team,notifyed: {$nin: [conn.username]}},p2pUrl,"p2p")
      .then(array=>{
        if (array)
        return {name: aUser.username,notify: array.length}
        return {name: aUser.username,notify: 0}
      })}))
    }




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

  function getOnLineUsers(conn) {
    return CLIENTS
    .filter(CONN=>CONN.state !== "closed")
    .filter(CONN=>CONN.username !== null)
    .filter(CONN=>CONN.username !== undefined)
    .filter(CONN=>CONN.team === conn.team)
    .map(CONN=>CONN.username)
  }

  function onlineList(conn) {
    if (conn.username) {
      let userList = getOnLineUsers(conn)
      //  return USERS.getAllUsers()
      return USERS.getUsersInTeam(conn.team)
      .then(userArray=>{console.log("user array is: ",userArray);return countNotificationsUser(userArray,conn)})
      .then(notifyedUserArray=>{
        console.log("notifyedUserArray",notifyedUserArray);
        return notifyedUserArray.map(aUser=>{
          if (aUser.name === conn.username)
          return
          console.log("OnlineList, aUser.name",aUser.name);
          if (userList.indexOf(aUser.name) > -1)
          return {name: aUser.name, status: "online",notify: aUser.notify}
          else {
            return {name: aUser.name,status: "offline",notify: aUser.notify}
          }
        })
      })
    }
    console.log("Oh now emptry");
    return Promise.resolve([])
  }


  function processOnline(message,conn) {
    onlineList(conn)
    .then(userList=> {
      console.log(userList)
      let payload = {type: "online",data: userList}
      send(payload,conn)
    }) }


    function boradcastLogin() {
      CLIENTS.filter(conn=>conn.state !== "closed")
      .filter(conn=>conn.username !== null)
      .filter(conn=>conn.username !== undefined)
      .forEach(conn=>{
        onlineList(conn)
        .then(oList=>{
          console.log("In BroadcastLogin");
          console.log(conn.username,oList)
          let payload = {type: "online",data: oList}
          send(payload,conn)
        })

      })
    }

    function broadcastChannel() {
      CLIENTS.filter(conn=>conn.state !== "closed")
      .filter(conn=>conn.username !== null)
      .filter(conn=>conn.username !== undefined)
      .forEach(conn=>{
        getUserChannels("",conn)
      })
    }



    function processSignal(message,conn) {
      CLIENTS.filter(conn=>conn.state !== "closed")
      .filter(conn=>conn.username !== null)
      .filter(conn=>conn.username !== undefined)
      .forEach(conn=>{
        if (conn.username === message.targetUser) {
          let payload = {type: "signal",payload: message}
          send(payload,conn)
        }
      })
    }

    function _processMessageUser(message,conn) {
      console.log("_processMessageUser", message);
      CLIENTS.filter(conn=>conn.state !== "closed")
      .filter(conn=>conn.username !== null)
      .filter(conn=>conn.username !== undefined)
      .filter(conn=>conn.team === message.team)
      .forEach(conn=>{
        console.log("processing _processMessageUser for user",conn.username,conn.team);
        if ((conn.username === message.targetUser || conn.username === message.sourceUser )) {
          let payload = {type: "message",payload: message}
          console.log("Sending to: ",conn.username,payload)
          // console.log(cl.username,payload);
          send(payload,conn)
        }
      })
    }

    function _processTypingUser(message,conn) {
      console.log("_processTypingUser", message);
      CLIENTS.filter(conn=>conn.state !== "closed")
      .filter(conn=>conn.username !== null)
      .filter(conn=>conn.username !== undefined)
      .forEach(conn=>{
        if ((conn.username === message.targetUser) && (conn.team === message.team)) {
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

      CLIENTS.filter(teamConn=>teamConn.state !== "closed")
      .filter(connection=>{console.log("DEBUG",conn); return connection.team === conn.team})
      .forEach(cl=>{
        let payload = {type: "message",payload: message}
        send(payload,cl)
        console.log("Sending processMessage: ",payload)
      })
    }


    function _addMessageId(message){
      let salt = crypto.randomBytes(10).toString('hex')
      message.id = crypto.createHash('sha1').update(message.content).digest('hex') + salt
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
      db.saveData(payload,p2pUrl,"p2p")
    }

    function _chStore(payload) {
      db.saveData(payload,chUrl,"channel")
    }


    function _playbackP2P(message,conn) {
      console.log("GotPlayback P2P",message);
      let query = {$or: [{sourceUser: conn.username,targetUser: message.userName,team: conn.team},{sourceUser: message.userName,targetUser: conn.username,team: conn.team}]}
      db.getData(query,p2pUrl,"p2p")
      .then(messageArray=>{
        if (messageArray) {
          let timeStamp = new Date().getTime()
          messageArray.forEach(m=>{
            var payload = Object.assign({},m);
            delete payload._id
            delete payload.notifyed
            payload.replay = timeStamp

            if (m.notifyed && m.notifyed.indexOf(conn.username) > -1) {
              payload.notifyed =  "X"
            }

            send({type: "message",payload: payload},conn)
            console.log(payload)
          })
        }})}



        function _playbackChannel(message,conn) {
          console.log("GotPlayback Channel",message);
          let query = {targetChannel: message.channelName,team: conn.team}
          db.getData(query,chUrl,"channel")
          .then(messageArray=>{
            if (messageArray) {
              let t = new Date().getTime()
              messageArray.forEach(m=>{
                var payload = Object.assign({},m);
                delete payload._id
                delete payload.notifyed
                payload.replay = t
                //let payload = {type: m.type,sourceUser: m.sourceUser,targetChannel: m.targetChannel,content: m.content,time: m.time,id: m.id,replay: t
                //  ,team: m.team}
                  if (m.notifyed && m.notifyed.indexOf(conn.username) > -1) {
                    payload.notifyed =  "X"
                  }
                  send({type: "message",payload: payload},conn)
                  console.log(payload);
                })
              }})}





              module.exports = {
                processSignal,
                processMessage,
                boradcastLogin,
                broadcastChannel,
                processOnline,
                onlineList,
                addConn,
                rmConn,
                incIndex
              }
