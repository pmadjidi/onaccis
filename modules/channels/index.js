"use strict"
var Promise = require("bluebird");
const assert = require('assert')
const db = require('../db/')
const utils = require('../utils/')
const online = require('../online/')
let channelUrl = db.db2Url("channel")
let chMetaUrl = db.db2Url("chmeta")




function findChannelName(channelName,team){
  return db.getOneData({name: channelName,team: team},chMetaUrl,"chmeta")
}

function findChannelsTeam(aTeam) {
  return db.getData({team: aTeam},chMetaUrl,"chmeta")
}


function createChannel(name,symb,team,owner,purpuse){
  return findChannelName(name,team)
  .then(ach=>{
    if (!ach) {
      let date = new Date().getTime()
      let ch = {}
      ch.date = date
      ch.name = name
      ch.symb = symb
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
  return createChannel(
    payload.channelname,
    payload.symb,
    payload.team,
    conn.username,
    payload.purpuse)
  }


  Grannar
  Loppis
  Anslagstavla
  Boka Tvättstuga
  Event

  function init(team) {
    let channels = [{name: "General",symb: "globe_with_meridians"},
    {name: "News",symb: "newspaper"},
    {name: "World",symb: "earth_africa"},
    {name: "Music",symb: "musical_score"},
    {name: "Pictures",symb:"camera_with_flash"},
    {name: "Grannar",symb: "couple"},
    {name: "Loppis",symb: "shopping_trolley"},
    {name: "Anslagstavla",symb:"clipboard"},
    {name: "Tvättstuga",symb:"jeans"},
    {name: "Event",symb:"spiral_calendar_pad"},



  ]

    channels.map(aChannel=>createChannel(aChannel.name,aChannel.symb,team,"system","system"))
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
        if (aChannel.purpuse === "") {
          aChannel.purpuse = "Created by " + utils.CL(aChannel.owner)
        }
        if (array)
        return {name: aChannel.name,symb: aChannel.symb,notify: array.length,purpuse: aChannel.purpuse}
        return {name: aChannel.name,symb: aChannel.symb,purpuse: aChannel.purpuse,notify: 0}
      })}))
    }



    function channelNotifyedMessage(message,conn) {
      let data = {id: message.id},
      data1 = {
        $addToSet: {
          notifyed: conn.username
        }
      }
      db.updateData(data,data1,"channel")
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
