"use strict"
const MongoClient = require('mongodb').MongoClient;
let onlineUrl = "mongodb://localhost:27017/sessions"
let onlineDb = null

MongoClient.connect(onlineUrl)
    .then(db=>{console.log("Connected to database online"); onlineDb = db})
    .catch(err=>console.log("Error Connecting to session " + onlineUrl + err))

    function findSessions() {
      let sessionarray =  onlineDb.collection("sessions").find().toArray()
      console.log("LOGGGING",myarray)
      sessionarray.then(a=>a.map(item=>console.log(item)))
      //.then(sessionList=>sessionList.map(session=>session.user))
    }



    function process(message,client){
      console.log(new Date() + "Processing Online user Lists....",JSON.stringify(message,null,4))
      findSessions()
      /*
      .then(userList=>{
        console.log(userList)
      //client.send(JSON.stringify({online: userList}))
      })
      .catch(err=>{
        console.log(err)
        client.send(JSON.stringify({online: "error"}))})
     }
     */
   }

    module.exports = {
      process
    }
