"use strict"
var Promise = require("bluebird");
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert')
const db = require('../db/')
let channelUrl = db.db2Url("channel")



function findChannelName(channelName,team){
  return db.getOneData({name: channelName,team: team},channelUrl,"channel")
}


function createChannel(ch){
  return findChannelName(ch.name,ch.team)
  .then(ach=>{
    if (!ach) {
        let date = new Date().getTime()
        ch.date = date
        return db.saveData(ch,channelUrl,"channel")
  }
  else {
    return "CHEXISTS"
  }
})
}


function getUserChannels(channelName,conn) {
  let channels = [{name: "General",notify: 0},{name: "News",notify: 0},{name: "World",notify:0},{name:"Bot",notify:0}]
  conn.client.send(JSON.stringify({type: "channels",data: channels}))
  countNotifications(channels,conn)
  .then(array=>console.log("DDDDDD",array))
}


function countNotifications(channelArray,conn) {
  return Promise.all(channelArray.map(aChannel=>{
    return db.getData({"targetChannel": aChannel.name},channelUrl,"channel")
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
    channelNotifyedMessage
    }
