"use strict"

const crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;
let userUrl = "mongodb://localhost:27017/users"
let sessionUrl = "mongodb://localhost:27017/sessions"

let AUTH = {}

function checkAuth(message,client) {
  if (message.type === "login")
    return true
  console.log("CheckAuth: ", message)
  let key = message.payload.session
  let now = new Date().getTime()
  console.log("KEY",key)
  console.log("AUTH",AUTH)

  if (key && AUTH.key) {
    return now <= AUTH.key.valid
  }
  else
    return false
}

let userDb = null
let sessionDb = null
MongoClient.connect(userUrl)
  .then(db=>{console.log("Connected to database users"); userDb = db})
  .catch(err=>console.log("Error Connecting to database " + userUrl + err))

MongoClient.connect(sessionUrl)
    .then(db=>{console.log("Connected to database sessions"); sessionDb = db})
    .catch(err=>console.log("Error Connecting to database " + sessionUrl + err))



function setSession(username,session,client) {
  let sesObj = {
    username: username,
    session: session,
    valid:  new Date().getTime() + 24 * 60 * 60 * 1000
  }
  console.log("SES",session)
  AUTH[session] = sesObj
  console.log(AUTH)
  client.onacciSession = sesObj
}



function findUser(username){
  return userDb.collection("users").findOne({username: username})
}

function createUser(username,password){
  let salt = crypto.randomBytes(128).toString('hex')
  let result = sha512(password,salt)
  console.log("Creating user......",username)
  let arg = {
    username: username,
    hash:  result.hash,
    salt: result.salt,
    time: new Date().getTime()
  }
  return userDb.collection("users").insert(arg)
}

function createSession(username,client) {
  let session = crypto.randomBytes(64).toString('hex')
  setSession(username,session,client)
  console.log("SES ",session);
  return session
}

function verifyUser(user,suggestedPassword){
  let hash = sha512(suggestedPassword,user.salt)
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

function process(message,client){
  console.log(new Date() + "Processing login....",JSON.stringify(message,null,4))
  return findUser(message.username)
  .then(user=>{
    if (!user)
      throw "NotFound"
    console.log("Found user " + user.username)
    return user
  })
  .then(user=>verifyUser(user,message.password))
  .then(status=>{
    if (status) {
      console.log("Auth accepted user " + message.username)
      return client.send(JSON.stringify({auth: "true",user: message.username, session: createSession(message.username,client)}))
    }
    else {
      console.log("Auth denied user " + message.username)
    return client.send(JSON.stringify({auth: "false", user: message.username}))
  }
  })
  .catch(err=>{

  if (err === "NotFound") {
  createUser(message.username,message.password)
   .then(client.send(JSON.stringify({auth: "true", user: message.username, session: createSession(message.username,client)})))
 }
 else {
     console.log(err)
 }
})
}


module.exports = {
  process,
  checkAuth
}
