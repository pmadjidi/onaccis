"use strict"
var Promise = require("bluebird");
const assert = require('assert')
const db = require('../db/')
let channelUrl = db.db2Url("channel")
let chMetaUrl = db.db2Url("chmeta")



function findChannelName(channelName,team){
  return db.getOneData({name: channelName,team: team},chMetaUrl,"chmeta")
}

function findChannelsTeam(aTeam) {
  return db.getData({team: aTeam},chMetaUrl,"chmeta")
}


function createChannel(name,team,owner){
  return findChannelName(name,team)
  .then(ach=>{
    if (!ach) {
        let date = new Date().getTime()
        let ch = {}
        ch.date = date
        ch.name = name
        ch.team = team
        ch.owner = owner
        return db.saveData(ch,chMetaUrl,"chmeta")
  }
  else {
    return "CHEXISTS"
  }
})
}

function init(team) {
  let channels = [{name: "General"},
                  {name: "News"},
                  {name: "World"},
                  {name: "Onacci"}]

  channels.map(aChannel=>createChannel(aChannel.name,team,"system"))
}

function getUserChannels(channelName,conn) {
  //let channels = [{name: "General",notify: 0},{name: "News",notify: 0},{name: "World",notify:0},{name:"Onacci",notify:0}]
//  conn.client.send(JSON.stringify({type: "channels",data: channels}))
  findChannelsTeam(conn.team)
  .then(channels=>{console.log("YYYYYY",channels);return countNotifications(channels,conn)})
  .then(array=>conn.client.send(JSON.stringify({type: "channels",data: array})))
}


function countNotifications(channelArray,conn) {
  return Promise.all(channelArray.map(aChannel=>{
    return db.getData({"targetChannel": aChannel.name,team: conn.team},channelUrl,"channel")
    .then(array=>{
      console.log("UUUUUU",array);
      if (array)
        return {name: aChannel.name,notify: array.length}
      return {name: aChannel.name,notify: 0}
      })}))
  }



function channelNotifyedMessage(message,conn) {
  let data = {id: message.id},
      data1 = {
            $addToSet: {
              notifyed: message.sourceUser
            }
        }
  db.updateData(data,data1)
}



    module.exports = {
    findChannelName,
    createChannel,
    getUserChannels,
    channelNotifyedMessage,
    init,
    findChannelsTeam
    }
