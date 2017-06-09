
const db = require('../db/')
const online = require('../online/')
const users = require('../users/')
let p2pUrl = db.db2Url("p2p")








  function userNotifyedMessage(message,conn) {
    let data = {id: message.id},
    dataSource = {
      $addToSet: {
        notifyed: conn.username
      }
    }
    db.updateData(data,dataSource,"p2p")
  }



      module.exports = {
        userNotifyedMessage
      }
