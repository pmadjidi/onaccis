'use strict'
var Promise = require("bluebird");
var googleFinance = Promise.promisifyAll(require('google-finance'));
var csv2json = require('csv2json');
var fs = require('fs');
var companyJson = require('./companylist.json')
const online  = require('../online/')
const db = require('../db/')
let marketsUrl = db.db2Url("markets")



//  payload = {type: "stocks",payload: {type,targetChannel,content}}
function processMarkets(payload,conn) {
  console.log("processMarkets",payload);
  let type = payload.type
  switch (type) {
    case "timeserie":
    getTimeSerie(payload,conn)
    break
    case "news":
    getStockNews(payload,conn)
    break
    case "list":
    getStockList(conn)
    break
    default:
    console.log("processStocks, Undefined message type: ",type)
  }

}

function getStockList(conn){
  let payload = JSON.stringify({type: "markets", payload: {instrumentlist: companyJson}})
  console.log("getStockList",payload);
  conn.client.send(payload)
}

function getAssetForChannel(payload,conn) {
  db.getData({team: conn.team,targetChannel: payload.channelName},assetUrl,"assets")
  .then(assets=>{console.log(assets);return conn.client.send(JSON.stringify({payload: {type: "assets",payload: assets}}))})
}


function getDateNow() {
let dateObj = new Date();
let month = dateObj.getUTCMonth() + 1; //months from 1-12
let day = dateObj.getUTCDate();
let year = dateObj.getUTCFullYear();
let newdate = year + "-" + month + "-" + day
console.log(newdate)
return newdate
}


function getTimeSerie(payload,conn) {
  let type = payload.selected.type
  let symbol = payload.instrument
  let newPayload = {type,symbol}
  if (type === "user") {
    payload.selected.type = "P2P"
    newPayload.targetUser = payload.targetUser
  }
  else {
  newPayload.targetChannel = payload.targetChannel
  }

  console.log("getTimeSerie",newPayload);
  let from = '2014-01-01'
  let to =   getDateNow()
  return googleFinance.historical({
  symbol,
  from, // from
  to // to
})
.then(timeseries=>{
  db.saveData(timeseries,marketsUrl,"timeseries")
  newPayload.timeseries = timeseries
  newPayload.content = "timeseries for " + symbol + " until:  " + to
  online.processMessage(newPayload,conn)
  //console.log("getTimeSerie",timeseries);
  //conn.client.send(JSON.stringify({type: "markets",payload: {type: "stock",instrument: symbol,timeseries: timeseries}}))})
})
.catch(err=>{
  newPayload.timeseries = []
  online.processMessage(newPayload,conn)
  console.log(err)
  //conn.client.send(JSON.stringify({type: "markets",payload: {type: "stock",instrument: symbol,timeseries: []}}))
})
}




function getStockNews(payload,conn) {
  let type = payload.selected.type
  let symbol = payload.instrument
  let newPayload = {typ,symbol}
  if (type === "user") {
    type = "P2P"
    newPayload.targetUser = payload.targetUser
  }
  else {
  newPayload.targetChannel = payload.targetChannel
  }
return googleFinance.companyNews({
   symbol
 })
 .then(news=>{
   db.saveData(news,marketsUrl,"news")
   newPayload.news = news
   online.processMessage(newPayload,conn)
  // conn.client.send(JSON.stringify({type: "markets", payload: {type: "news",instrument: symbol,data: news}}
})
 .catch(err=>{
   newPayload.news = []
   online.processMessage(newPayload,conn)
   console.log(err)
   //conn.client.send(JSON.stringify({type: "markets", payload: {type: "news",instrument: symbol,data: []}}))
 })
}


module.exports = {
  processMarkets
}
