const MongoClient = require('mongodb').MongoClient;
let sessionUrl = "mongodb://localhost:27017/sessions"
let sessionDb = null

MongoClient.connect(sessionUrl)
    .then(db=>{console.log("Connected to database sessions"); sessionDb = db})
    .catch(err=>console.log("Error Connecting to database " + sessionUrl + err))

    function findSessions() {
      return sessionDb.collection("sessions").find()
    }



    function process(message,client){
      console.log(new Date() + "Processing login....",JSON.stringify(message,null,4))
      findSessions()
      .then(userList=>{
      client.send(JSON.stringify({online: userList}))
      })
      .catch(err=>{
        console.log(err)
        client.send(JSON.stringify({online: "error"}))})
     }


    module.exports = {
      process
    }
