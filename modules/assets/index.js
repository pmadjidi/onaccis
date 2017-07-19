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
  db.getData(
    {$or: [
      {team: conn.team,sourceUser: payload.userName,targetUser: conn.username},
      {team: conn.team,sourceUser: conn.username,targetUser: payload.userName}
      ]
      },
    assetUrl,"assets")
  .then(assets=>{console.log(assets);return conn.client.send(JSON.stringify({type: "assets",payload: assets}))})

}


function image(payload,conn) {

  let image = payload.file.split(',')[1]
  let filename = payload.name
  let user = payload.sourceUser
  let team = payload.team
  var bitmap = new Buffer(image, 'base64');
  let fpath = "../web/build/assets/" + team + "/"
  let contentSymbol
  let fileExt

  fileExt = message.name.split('.').pop().toUpperCase();
  switch (fileExt) {
      case "GIF":
      case "TIF":
      case "SVG":
      case "BMP":
      case "PNG":
      case "JPG":
      contentSymbol = ":camera: "
      break
      case "MP3":
      contentSymbol = ":musical_note: "

      break
      case "PDF":
      contentSymbol = ":page_with_curl:"
      break
      default:
        console.log("Unknown media file.....");
    }


  payload.file = crypto.randomBytes(32).toString('hex')
  payload.content = contentSymbol + "   " + filename

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







module.exports = {
  processAsset
}
