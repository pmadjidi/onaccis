'use strict'
var Promise = require("bluebird");
var googleFinance = Promise.promisifyAll(require('google-finance'));
var csv2json = require('csv2json');
var fs = require('fs');
var companyJson = require('./companylist.json')
const online  = require('../online/')
const db = require('../db/')
let sessionUrl = db.db2Url("sessions")


//  payload = {type: "stocks",payload: {type,targetChannel,content}}
function processStocks(payload,conn) {
  let type = payload.type
  switch (type) {
    case "timeserie":
    getTimeSerie(payload.stock,conn)
    break
    case "news":
    getNews(payload.stock,conn)
    break
    case "list":
    getStockList(conn)
    break
    default:
    console.log("processAsset, Undefined message type: ",type)
  }

}

function getStockList(conn){
  conn.send(JSON.stringify({type: "list", data: companyJson }))
}

function getAssetForChannel(payload,conn) {
  db.getData({team: conn.team,targetChannel: payload.channelName},assetUrl,"assets")
  .then(assets=>{console.log(assets);return conn.client.send(JSON.stringify({type: "assets",payload: assets}))})
}




function getTimeSerie(symbol,conn) {
  let from = '2014-01-01'
  let to =   getDateNow()
  return googleFinance.historical({
  symbol,
  from, // from
  to // to
})
.then(stock=>conn.send(JSON.stringify({type: "stock",stock: symbol,data: stock})))
.catch(err=>{
  console.log(err)
  conn.send(JSON.stringify({type: "stock",stock: symbol,data: []}))
})
}




function getStockNews(symbol) {
return googleFinance.companyNews({
   symbol
 })
 .then(news=>conn.send(JSON.stringify({type: "stocknews",stock: symbol,data: news})))
 .catch(err=>{
   console.log(err)
   conn.send(JSON.stringify({type: "stocknews",stock: symbol,data: []}))
 })
}


module.exports = {
  processStocks
}
