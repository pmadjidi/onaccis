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
  let timestamp =  new Date().getTime() + 24 * 60 * 60 * 1000
    return sessionDb.collection("sessions").insert(
   {
     username: username,
     session: session,
     valid: timestamp
   })
}

function findSession(username) {
  return sessionDb.collection("sessions").findOne({username: username})
}


function findUser(username){
  return userDb.collection("users").findOne({username: username})
}

function createUser(username,password){
  let salt = crypto.randomBytes(128).toString('hex')
  let result = sha512(password,salt)
  return userDb.collection("users").insert(
     {
       username: username,
       hash:  result.hash,
       salt: result.salt,
       time: new Date().getTime()
     })
}

function createSession(username) {
  let session = crypto.randomBytes(128).toString('hex')
  setSession(message.username,session)
  return session
}


function process(message,client){
  console.log("Login message recieved",message)
  findUser(message.username)
  .then(user=>{
    if (!user)
      throw "Not Found"
    console.log("User = " + JSON.stringify(user))
    return user
  })
  .then(user=>{
    let hash = sha512(message.password,user.salt)
    if (hash === user.hash) {
      let session = createSession(message.username)
      return client.send(JSON.stringify({auth: "true",user: message.username, session: session}))
    }
    else {
        return client.send(JSON.stringify({auth: "false", user: message.username}))
    }
  })
  .catch(err=>{
  console.log("No User "+ err)
  console.log("Creating user......")
  let session = createSession(message.username)
  createUser(message.username,message.password)
   .then(client.send(JSON.stringify({auth: "true", user: message.username, session:session})))
})
}

let sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        hash:value
    };
};


module.exports = {
  process
}
