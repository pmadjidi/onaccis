"use strict"
const crypto = require('crypto');

const db = require('../db/')
let sessionUrl = db.db2Url("session")

let SESS_CACHE = {}




function createSession(conn) {
  let key = crypto.randomBytes(64).toString('hex')
  conn.auth = true
  conn.session = key
  conn.valid =  new Date().getTime()
  let payload = {username: conn.username,session: conn.session,valid: conn.valid,team: conn.team,ip: conn.ip,port: conn.port}
  SESS_CACHE[key] = payload
  return db.saveData(payload,sessionUrl,"sessions")
}

function checkAuth(message,conn) {
  if (message.type === "login")
  return true
  if (SESS_CACHE[conn.session])
  return true
  else {
    return false
  }
}

function processSession(payload,conn){
console.log("validating session key:",payload.session);
console.log("DEBUG",SESS_CACHE);
if (SESS_CACHE[payload.session]) {
  console.log("SEESSION STILL VALID......");
    conn.auth = true
    conn.session = SESS_CACHE[payload.session].session
    conn.valid = SESS_CACHE[payload.session].valid
    conn.username =  SESS_CACHE[payload.session].username
    conn.team =  SESS_CACHE[payload.session].team
    conn.client.send(JSON.stringify({type: "auth",auth: conn.auth,user: conn.username,
      session: conn.session,team: conn.team}))

  }
else {
  console.log("SESSION INVALID.......");
  conn.auth = false
  conn.session =  ""
  conn.valid = false
  conn.username =   ""
  conn.team =  ""
  conn.client.send(JSON.stringify({type: "auth",auth: "false",user: conn.username,
      session: "null",team: conn.team}))
}
}

module.exports = {
  createSession,
  checkAuth,
  processSession
}
