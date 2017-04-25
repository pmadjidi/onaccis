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



function setSession(username,sesssion) {
  let timestamp =  new Date().getTime() + 24 * 60 * 60 * 1000
    return sessionDb.collection("sessions").insert(
   {
     username: username,
     session: session,
     valid: timestamp
   })
}


function process(message,client){
  console.log("Login message recieved",message)
  userDb.collection("user").findOne({username: message.username})
  .then(user=>{
    console.log("User = " + user)
    if (!user)
      throw "Not Found"
    return user
  })
  .then(user=>{
    let hash = sha512(message.password,user.salt)
    if (hash === user.hash) {
      let session = crypto.randomBytes(128).toString('hex')
      setSession(message.username,session)
      return client.send(JSON.stringify({auth: "true",user: message.username, session: session}))
    }
    else {
        return client.send(JSON.stringify({auth: "false", user: message.username}))
    }
  })
  .catch(err=>{
    console.log("No User "+err)
  console.log("Creating user......")
let session = crypto.randomBytes(128).toString('hex')
console.log(session)
let salt = crypto.randomBytes(128).toString('hex')
let result = sha512(message.password,salt)
console.log("Result = " + result)
setSession(message.username,session)
return userDb.collection("user").insert(
   {
     username: message.username,
     hash:  result.hash,
     salt: result.salt,
     time: new Date().getTime()
   })
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
