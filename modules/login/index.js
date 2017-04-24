"use strict"
var bcrypt = require('bcrypt');

function process(message,client){
  console.log("Login message recieved",message)
var salt = bcrypt.genSaltSync(128);
console.log({salt})
var hash = bcrypt.hashSync(message.password, salt)
console.log({salt,hash})
}




module.exports = {
  process
}
