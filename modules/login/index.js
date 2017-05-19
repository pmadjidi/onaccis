"use strict"
const MongoClient = require('mongodb').MongoClient;
const crypto = require('crypto');

let userUrl = "mongodb://localhost:27017/users"
const sess = require('../sessions/')


let userDb = null

MongoClient.connect(userUrl)
  .then(db=>{console.log("Connected to database users"); userDb = db})
  .catch(err=>console.log("Error Connecting to database " + userUrl + err))



function findUser(conn){
  return userDb.collection("users").findOne({username: conn.username})
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
  console.log(1)
  console.log(new Date() + "Processing login....",JSON.stringify(message,null,4))
  conn.username = message.username
  conn.team = message.team
  return findUser(conn)
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
  createUser(message.username,message.password)
   .then(inserted=>{
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
