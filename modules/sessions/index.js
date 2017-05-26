"use strict"
const crypto = require('crypto');

const db = require('../db/')
let sessionUrl = db.db2Url("session")

let SESSS_CACHE = {}




    function createSession(conn) {
      let key = crypto.randomBytes(64).toString('hex')
      conn.auth = true
      conn.session = key
      conn.valid =  new Date().getTime()
      let payload = {username: conn.username,session: conn.session,valid: conn.valid,team: conn.team,ip: conn.ip,port: conn.port}
      SESSS_CACHE[key] = payload
      return db.saveData(payload,sessionUrl,"sessions")
    }

    function checkAuth(message,conn) {
      if (message.type === "login")
        return true
      if (SESSS_CACHE[conn.session])
        return true
      else {
          return false
      }
    }

    module.exports = {
      createSession,
      checkAuth
    }
