"use strict"
var Promise = require("bluebird");
const assert = require('assert')
const db = require('../db/')
const online = require('../online/')
let channelUrl = db.db2Url("channel")
let chMetaUrl = db.db2Url("chmeta")



function findChannelName(channelName,team){
  return db.getOneData({name: channelName,team: team},chMetaUrl,"chmeta")
}

function findChannelsTeam(aTeam) {
  return db.getData({team: aTeam},chMetaUrl,"chmeta")
}


function createChannel(name,team,owner,purpuse){
  return findChannelName(name,team)
  .then(ach=>{
    if (!ach) {
      let date = new Date().getTime()
      let ch = {}
      ch.date = date
      ch.name = name
      ch.team = team
      ch.owner = owner
      ch.purpuse = purpuse
      db.saveData(ch,chMetaUrl,"chmeta")
      .then(result=> online.broadcastChannel())
    }
    else {
      return Promise.resolve("CHEXISTS")
    }
  })
}

function initChannel(payload,conn) {
  return createChannel(payload.channelname,
    payload.team,
    payload.sourceUser)
  }

  function init(team) {
    let channels = [{name: "General"},
    {name: "News"},
    {name: "World"},
    {name: "Onacci"}]

    channels.map(aChannel=>createChannel(aChannel.name,team,"system","system"))
  }

  function getUserChannels(channelName,conn) {
    console.log("getUserChannels",conn.team);
    return  findChannelsTeam(conn.team)
    .then(channels=>countNotifications(channels,conn))
    .then(array=>conn.client.send(JSON.stringify({type: "channels",data: array})))
  }


  function countNotifications(channelArray,conn) {
    return Promise.all(channelArray.map(aChannel=>{
      return db.getData({"targetChannel": aChannel.name,team: conn.team,notifyed: {$nin: [conn.username]}},channelUrl,"channel")
      .then(array=>{
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
      findChannelsTeam,
      initChannel
    }
