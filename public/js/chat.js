// start socket io
const socket = io()

// elements
const chatForm = document.querySelector("#message-form")
const chatText = document.querySelector("#chatText")
const sendText = document.querySelector("#sendText")
const messages = document.querySelector("#messages")
const sidebar = document.querySelector("#sidebar")
//templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix:true})

//Join room
socket.emit('join',{username, room},(error)=>{
  if(error){
    alert(error)
    location.href="/"
  }
})

const autoscroll = ()=>{

    // New message element
    const $newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = (messages.scrollTop + visibleHeight)*2

    if (containerHeight - newMessageHeight < scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }

}

//listen to message from server
socket.on("message", (text)=>{
  console.log(text)
 
    const html = Mustache.render(messageTemplate,{
      username: text.username,
      message:text.text,
      createdAt: moment(text.createdAt).format('h:m a')
    
    })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
  })

  socket.on("locationMessage", (location)=>{
    const html = Mustache.render(locationTemplate,
      {
        username: location.username,
        url:location.text,
        createdAt: moment(location.createdAt).format('h:mm a')
      })
    messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
  })
  

socket.on("roomData",({room, users})=>{
  const html = Mustache.render(sidebarTemplate,{
    room,
    users
  })
  sidebar.innerHTML = html
})


chatForm.addEventListener("submit",(e)=>{
  e.preventDefault()
  if(chatText.value===""){
    return alert("please type a message")
  }
  //disable button
  sendText.setAttribute("disabled","disabled")
  // send a new event to server
  socket.emit("sendMessage", chatText.value, (error)=>{
    sendText.removeAttribute("disabled")  
    chatText.value = ''
    chatText.focus()

    if(error) return console.log(error)

    console.log("delivered")
  })
})

document.querySelector("#sendLocation").addEventListener("click",(e)=>{
  e.target.setAttribute("disabled","disabled")
  if(!navigator.geolocation){
    return alert("your browser does not support geolocation")
  }

  navigator.geolocation.getCurrentPosition((position)=>{
    const locationCoords = {lat: position.coords.latitude, long: position.coords.longitude}
    socket.emit("sendLocation", locationCoords, (acknowledge)=>{
      e.target.removeAttribute("disabled")
      console.log(acknowledge)
    })
  })
})