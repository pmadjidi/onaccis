const MongoClient = require('mongodb').MongoClient;
let sessionUrl = "mongodb://localhost:27017/sessions"
const crypto = require('crypto');

let sessionDb = null
let SESSS_CACHE = {}

MongoClient.connect(sessionUrl)
    .then(db=>{console.log("Connected to database sessions"); sessionDb = db})
    .catch(err=>console.log("Error Connecting to database " + sessionUrl + err))


    function createSession(conn) {
      let key = crypto.randomBytes(64).toString('hex')
      conn.auth = true
      conn.session = key
      conn.valid =  new Date().getTime()
      let payload = {username: conn.username,session: conn.session,valid: conn.valid,team: conn.team,ip: conn.ip,port: conn.port}
      SESSS_CACHE[key] = payload
      sessionDb.collection("sessions")
      .insert(payload)
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
