"use strict"
var Promise = require("bluebird");
const db = require('../db/')
let userUrl = db.db2Url("users")



function getUsersInTeam(channelName,team){
  return db.getOneData({team: team},userUrl,"users")
}



module.exports = {
getUsersInTeam
}
