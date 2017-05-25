"use strict"
var Promise = require("bluebird");
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert')
let channelsUrl = "mongodb://localhost:27017/channel"
let channelsDb = null

function saveData(data) {
  MongoClient
    .connect(channelsUrl, {
      promiseLibrary: Promise
    })
    .then(function(db) {
      return db
        .collection('channel')
        .insert(data)
        .finally(db.close.bind(db))
    })
    .catch(function(err) {
      console.error("ERROR", err);
    });
}


function getData(query,dbUrl,collectionName) {
  MongoClient
    .connect(dbUrl, {
      promiseLibrary: Promise
    })
    .then(db => {
      return db
        .collection(collectionName)
        .find(query)
        .toArray()
    })
    .then(anArray=>{console.log(anArray.length)
    return anArray
    })
    .catch(function(err) {
      console.error("ERROR", err)
    })
}

function updateData(data,data1) {
  MongoClient
    .connect(channelsUrl, {
      promiseLibrary: Promise
    })
    .then(function(db) {
      return db
        .collection('channel')
        .update(data,data1)
        .finally(db.close.bind(db))
    })
    .catch(function(err) {
      console.error("ERROR", err);
    });
}






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
}


function countNotifications(channelArray,conn) {
  Promise.all(channelArray.map(aChannel=>{
    return Promise.resolve(getData({"targetChannel": aChannel.name},channelsUrl,"channel"))
    .then(array=>{return {name: aChannel.name,count: array.length}})}))
  }



function channelNotifyedMessage(message,conn) {
  let data = {id: message.id},
      data1 = {
            $addToSet: {
              notifyed: message.sourceUser
            }
        }
  updateData(data,data1)
}




function channelNotifyedMessage1(message,conn) {
  channelsDb.collection("channel").update({
            id: message.id
        }, {
             $addToSet: {
              notifyed: message.sourceUser
            }
        },
        { upsert: true }
        , function(err, results) {
            console.log(err);
            console.log(results.result);
        })
    }


    module.exports = {
    findChannelName,
    findChannelTeam,
    createChannel,
    getUserChannels,
    channelNotifyedMessage
    }
