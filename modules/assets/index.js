'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp');
const crypto = require('crypto');
const db = require('../db/')
const online  = require('../online/')
const assetUrl = db.db2Url("assets")




function processAsset(payload,conn) {
  let type
  if (payload.file)
  type = "store"
  else
  type = payload.type

  switch (type) {
    case "channel":
    getAssetForChannel(payload,conn)
    break
    case "user":
    getAssetForUser(payload,conn)
    break
    case "store":
    image(payload,conn)
    break
    default:
    console.log("processAsset, Undefined message type: ",type)
  }

}


function getAssetForChannel(payload,conn) {
  db.getData({team: conn.team,targetChannel: payload.channelName},assetUrl,"assets")
  .then(assets=>{console.log(assets);return conn.client.send(JSON.stringify({type: "assets",payload: assets}))})
}



function getAssetForUser(payload,conn) {
  db.getData({team: conn.team,targetUser: payload.userName},assetUrl,"assets")
  .then(assets=>{console.log(assets);return conn.client.send(JSON.stringify({type: "assets",payload: assets}))})

}


function image(payload,conn) {

  let image = payload.file.split(',')[1]
  let filename = payload.name
  let user = payload.sourceUser
  let team = payload.team
  var bitmap = new Buffer(image, 'base64');
  let fpath = "../onacci/public/assets/" + team + "/"
  payload.file = crypto.randomBytes(32).toString('hex')
  payload.content = ":ok_hand: File:" + filename + " uploaded...."

  mkdirp(fpath, function (err) {
    if (err) console.error(err)
    else {
      fs.writeFile(fpath + payload.file, bitmap,err => {
        if(err) {
          return console.log(err);
        }
        console.log('******** File created from base64 encoded string ********');
        db.saveData(payload,assetUrl,"assets")
        .then(()=>online.processMessage(payload,conn))
        console.log(payload);
      })
    }
  })
}


function sound(payload,conn) {

}

function video(payload,conn) {

}






module.exports = {
  processAsset
}
