'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp');




function processAsset(payload,conn) {
  let image = payload.file.split(',')[1]
  let filename = payload.name
  let user = payload.sourceUser
  let team = payload.team
  var bitmap = new Buffer(image, 'base64');
  let fpath = "../onacci/public/assets/" + team + "/"

  mkdirp(fpath, function (err) {
    if (err) console.error(err)
    else {
      fs.writeFile(fpath +  user + "@" + filename, bitmap);
      console.log('******** File created from base64 encoded string ********');
    }
})

}






    module.exports = {
    processAsset
    }
