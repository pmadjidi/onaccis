"use strict"

const crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;
let dbUrl = "mongodb://localhost:27017/users"
let DB = null
MongoClient.connect(dbUrl)
  .then(db=> DB = db)
  .catch(err=>console.log("Error Connecting to database " + dbUrl + err))

function process(message,client){
  console.log("Login message recieved",message)
  DB.collection.findOne({username: message.username})
  .then(user=>console.log(user))
  .catch(err=>console.log(err))
  
let salt = crypto.randomBytes(128).toString('hex')
let result = sha512(message.password,salt)
console.log(result)
}


let sha512 = function(password, salt){
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt:salt,
        passwordHash:value
    };
};


module.exports = {
  process
}
