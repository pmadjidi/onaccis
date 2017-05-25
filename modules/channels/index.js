"use strict"
var Promise = require("bluebird");
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert')
const db = require('../db/')
let channelUrl = db.db2Url("channel")


function findChannelName(channelName){
  return channelsDb.collection("channel").findOne({channelName})
}



function findChannelTeam(teamName,conn){
  return channelsDb.collection("channel").find({teamName})
}

function createChannel(channelName,conn){
  return findChannelName(channelName)
  .then(channel=>{
    if (!channel) {
    //create channel
    // return channel
  }
  else {

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
    findChannelTeam,
    createChannel,
    getUserChannels,
    channelNotifyedMessage
    }
