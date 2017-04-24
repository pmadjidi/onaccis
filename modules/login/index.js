"use strict"
var bcrypt = require('bcrypt');

function process(message,client){
  console.log("Login message recieved",message)
let salt = bcrypt.genSaltSync(128);
console.log({salt})
let hash = bcrypt.hashSync(message.password, salt)
console.log({salt,hash})
}




module.exports = {
  process
}
