"use strict"

const MongoClient = require('mongodb').MongoClient;
let channelsUrl = "mongodb://localhost:27017/channels"
let channelsDb = null

MongoClient.connect(channelsUrl)
  .then(db=>{console.log("Connected to database channels"); channelsDb = db})
  .catch(err=>console.log("Error Connecting to database " + channelsUrl + err))

function findChannelName(channelName){
  return channelsDb.collection("channels").findOne({channelName})
}



function findChannelTeam(teamName,conn){
  return channelsDb.collection("channels").find({teamName})
}

function createChannel(channelName,conn){
  return findChannelName(channelName)
  .then(channel=>{
    if (!channel) {
    //create channel
    // return channel
  }
  else {
    //singal Usrer channel Name exists
  }
})
}


function getUserChannels(channelName,conn) {
  let channels = ["General","News","World","Bot"]
  conn.client.send(JSON.stringify({type: "channels",data: channels}))

}




    module.exports = {
    findChannelName,
    findChannelTeam,
    createChannel,
    getUserChannels
    }
