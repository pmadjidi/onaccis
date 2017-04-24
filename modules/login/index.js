"use strict"
var crypto = require('crypto');

function process(message,client){
  console.log("Login message recieved",message)
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
