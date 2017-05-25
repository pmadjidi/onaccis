"use strict"
var Promise = require("bluebird");
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert')
const crypto = require('crypto');

let userUrl = "mongodb://localhost:27017/users"
const sess = require('../sessions/')

let host = "localhost"
let port = "27017"
let url = host + ":" + port

function  db2Url(dbName) {
  let host = "localhost"
  let port = "27017"
  let url = host + ":" + port
  return "mongodb" + "://" + url + "/" + dbName
}


let channelsUrl = db2Url("channel")
let p2pUrl = db2Url("p2p")
let sessUrl =  db2Url("session")




  function saveData(data,dbUrl,collectionName) {
    return MongoClient
      .connect(dbUrl, {
        promiseLibrary: Promise
      })
      .then(db => {
        return db
          .collection(collectionName)
          .insert(data)
          .finally(db.close.bind(db))
      })
      .catch(function(err) {
        console.error("ERROR", err);
      });
  }


  function getData(query,dbUrl,collectionName) {
    return MongoClient
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

  function getOneData(query,dbUrl,collectionName) {
    return MongoClient
      .connect(dbUrl, {
        promiseLibrary: Promise
      })
      .then(db => {
        return db
          .collection(collectionName)
          .findOne(query)
      })
      .then(item=>{console.log(item)
      return item
      })
      .catch(function(err) {
        console.error("ERROR", err)
      })
  }



  function updateData(data,data1) {
    return MongoClient
      .connect(channelsUrl, {
        promiseLibrary: Promise
      })
      .then(db => {
        return db
          .collection('channel')
          .update(data,data1)
          .finally(db.close.bind(db))
      })
      .catch(function(err) {
        console.error("ERROR", err);
      });
  }



  module.exports = {
    updateData,
    getOneData,
    getData,
    saveData,
    db2Url
  }
