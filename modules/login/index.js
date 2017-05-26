"use strict"
const MongoClient = require('mongodb').MongoClient;
const crypto = require('crypto');

/*
let userUrl = "mongodb://localhost:27017/users"
*/

const sess = require('../sessions/')
const db = require('../db/')
const ch = require('../channels/')
let userUrl = db.db2Url("users")



function findUser(conn){
  let aUser = db.getOneData({username: conn.username,team: conn.team},userUrl,"users")
  return aUser
}

function findTeam(conn) {
  let aTeam = db.getOneData({team: conn.team},userUrl,"users")
  return aTeam
}

function createUser(username,team,password){
  let salt = crypto.randomBytes(128).toString('hex')
  let result = sha512(password,salt)
  console.log("Creating user......",username)
  let arg = {
    username: username,
    team: team,
    hash:  result.hash,
    salt: result.salt,
    time: new Date().getTime()
  }
  return db.saveData(arg,userUrl,"users")
}



function verifyUser(user,suggestedPassword){
  let hash = sha512(suggestedPassword,user.salt)
  console.log(hash.hash,user.hash)
  if (hash.hash === user.hash)
    return true
  return false
}

function sha512(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        hash:value
    };
};

function process(message,conn,broadFunc){

  conn.username = message.username
  conn.team = message.team
  let initTeam = false
  return findTeam(conn)
  .then(team=>{
    if(!team) {
      initTeam = true
      throw "NotFound"
    }
    return initTeam
  })
  .then(firstTime=>findUser(conn))
  .then(user=>{
    if (!user)
      throw "NotFound"
    console.log("Found user:" + conn.username,"@ Team: ",conn.team)
    return user
  })
  .then(user=>verifyUser(user,message.password))
  .then(status=>{
    if (status) {
      console.log("Auth accepted user " + conn.username,"@ Team: ",conn.team)
      sess.createSession(conn)
      broadFunc()
      return conn.client.send(JSON.stringify({type: "auth",auth: "true",user: conn.username,
       session: conn.session,team: conn.team}))
    }
    else {
      console.log("Auth denied user " + message.username)
      conn.auth  = false
    return conn.client.send(JSON.stringify({type: "auth",auth: conn.auth, user: message.username,team: conn.team}))
  }
  })
  .catch(err=>{
  if (err === "NotFound") {
  createUser(message.username,message.team,message.password)
   .then(inserted=>{
     ch.init(message.team)
     console.log("User created: ",inserted);
     sess.createSession(conn)
     broadFunc()
     conn.client.send(JSON.stringify({type: "auth",auth: conn.auth, user: conn.username,
    session: conn.session,team: conn.team}))
 })
 }
 else {
     console.log(err)
 }
})
}


module.exports = {
  process
}
