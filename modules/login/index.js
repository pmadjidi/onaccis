"use strict"

const crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;
let dbUrl = "mongodb://localhost:27017/users"
let DB = null
MongoClient.connect(dbUrl)
  .then(db=>{console.log("Connected to database users"); DB = db})
  .catch(err=>console.log("Error Connecting to database " + dbUrl + err))

function setSession(username,sesssion) {
    return DB.collection("sesssion").insert(
   {
     username: username,
     session: session
     time: new Date().getTime()
   })
}


function process(message,client){
  console.log("Login message recieved",message)
  DB.collection("user").findOne({username: message.username})
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
let salt = crypto.randomBytes(128).toString('hex')
let result = sha512(message.password,salt)
console.log("Result = " + result)
return DB.collection("user").insert(
   {
     username: message.username,
     hash:  result.hash,
     salt: result.salt,
     time: new Date().getTime()
   })
   .then(setSession(message.username,session))
   .then(client.send(JSON.stringify({auth: "true", user: message.username})))
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
