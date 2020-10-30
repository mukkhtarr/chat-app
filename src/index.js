const path = require('path')
const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage} = require('./utils/messages')
const {addUser,removeUser,getUser, getUsersInRoom}=require('./utils/users')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDir = path.join(__dirname,'../public')

app.use(express.static(publicDir))

io.on('connection',(socket)=>{
  console.log('A new Web Socket Connection')
  socket.on('join',(options,callback)=>{

    const {error, user} = addUser({id:socket.id,...options})

    if(error){
      return callback(error)
    }

    socket.join(user.room)
    socket.emit("message",generateMessage("System","Welcome to the Chat, " + user.username))
    socket.broadcast.to(user.room).emit("message",generateMessage("System",`${user.username} has joined`))
    
    io.to(user.room).emit("roomData",{
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })
  
  socket.on("sendMessage",(chatText, callback)=>{
    const user = getUser(socket.id)
    if(user){
      const profanity = new Filter()
      if(profanity.isProfane(chatText)){
        return callback("Profanity not allowed")
      }
      io.to(user.room).emit("message",generateMessage(user.username,chatText))
      callback()
    }
  })
  socket.on("sendLocation",(location, callback)=>{
    const user = getUser(socket.id)
    if(user){
      io.to(user.room).emit("locationMessage",generateMessage(user.username,`https://maps.google.com/?q=${location.lat},${location.long}`))
    }
    callback("Location Shared")
  })
  socket.on("disconnect", ()=>{
    const user = removeUser(socket.id)
    if(user){
      io.to(user.room).emit("message",generateMessage("System",user.username+" has left"))
      io.to(user.room).emit("roomData",{
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
    
  })
})



server.listen(port, ()=>{
  console.log(`Server is up on port ${port}`)
})