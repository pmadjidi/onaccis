'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp');



function processUserAvatar(payload,conn) {
  let image = payload.file.split(',')[1]
  let filename = payload.name
  let user = payload.sourceUser
  let team = payload.team
  var bitmap = new Buffer(image, 'base64');
  let fpath = "../web/build/avatar/user/" + team + "/"

  mkdirp(fpath, function (err) {
    if (err) console.error(err)
    else {
      fs.writeFile(fpath +  user + ".png", bitmap);
      console.log('******** File created from base64 encoded string ********');
    }
})
}


function processTeamAvatar(payload,conn) {
  let image = payload.file.split(',')[1]
  let filename = payload.name
  let user = payload.sourceUser
  let team = payload.team
  var bitmap = new Buffer(image, 'base64');
  let fpath = "../web/build/avatar/team/" + team + "/"

  mkdirp(fpath, function (err) {
    if (err) console.error(err)
    else {
      fs.writeFile(fpath +  team + ".png", bitmap);
      console.log('******** File created from base64 encoded string ********');
    }
})
}

function processAvatar(payload,conn) {
  if (payload.type === "user") {
    processUserAvatar(payload,conn)
  }
  else {
    processTeamAvatar(payload,conn)
  }
}





    module.exports = {
    processAvatar
    }
