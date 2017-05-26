"use strict"
var Promise = require("bluebird");
const db = require('../db/')
let userUrl = db.db2Url("users")



function getUsersInTeam(team){
  return db.getData({team: team},userUrl,"users")
}

function getAllUsers(){
  return db.getData({},userUrl,"users")
}



module.exports = {
getUsersInTeam,
getAllUsers
}
