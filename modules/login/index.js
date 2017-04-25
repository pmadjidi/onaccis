"use strict"

const crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;
let userUrl = "mongodb://localhost:27017/users"
let sessionUrl = "mongodb://localhost:27017/sessions"

let userDb = null
let sessionDb = null
MongoClient.connect(userUrl)
  .then(db=>{console.log("Connected to database users"); userDb = db})
  .catch(err=>console.log("Error Connecting to database " + userUrl + err))

MongoClient.connect(sessionUrl)
    .then(db=>{console.log("Connected to database sessions"); sessionDb = db})
    .catch(err=>console.log("Error Connecting to database " + sessionUrl + err))



function setSession(username,session) {
    return sessionDb.collection("sessions").insert(
   {
     username: username,
     session: session,
     valid:  new Date().getTime() + 24 * 60 * 60 * 1000
   })
}

function findSession(username) {
  return sessionDb.collection("sessions").findOne({username: username})
}


function findUser(username){
  return userDb.collection("users").findOne({username: username})
}

function createUser(username,password){
  console.log(3);
  let salt = crypto.randomBytes(128).toString('hex')
  console.log(4);
  let result = sha512(password,salt)
  console.log("Creating user......",username)
  let arg = {
    username: username,
    hash:  result.hash,
    salt: result.salt,
    time: new Date().getTime()
  }
  console.log(arg);
  return userDb.collection("users").insert(arg)
}

function createSession(username) {
  let session = crypto.randomBytes(64).toString('hex')
  setSession(message.username,session)
  return session
}

function verifyUser(user,suggestedPassword){
  let hash = sha512(suggestedPassword,user.salt)
  if (hash === user.hash)
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
  findUser(message.username)
  .then(user=>{
    if (!user)
      throw "NotFound"
    console.log("Found user " + user.username)
    return user
  })
  .then(user=>{
    if (veifyUser(user,message.password)) {
      console.log("Auth accepted user " + user.username)
      return client.send(JSON.stringify({auth: "true",user: message.username, session: createSession(message.username)}))
    }
      console.log("Auth denied user " + user.username)
    return client.send(JSON.stringify({auth: "false", user: message.username}))
  })
  .catch(err=>{

  if (err === "NotFound") {
    console.log("2");
  createUser(message.username,message.password)
   .then(client.send(JSON.stringify({auth: "true", user: message.username, session: createSession(message.username)})))
 }
 else {
     console.log(err)
 }
})
}


module.exports = {
  process
}
