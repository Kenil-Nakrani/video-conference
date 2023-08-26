const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyparser = require('body-parser')
const encoder = bodyparser.urlencoded();
// const cors = require('cors')
// app.use(cors())
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid')

app.use('/peerjs', peerServer);




let connection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : "",
    database : "event"
})

connection.connect(function(err){
    if(err) throw err;
    console.log("Database created");
})

app.get("/",function(req,resp){
    resp.sendFile(__dirname + "/register.html");
});

app.post("/",encoder,function(req,resp){
    var name = req.body.name
    var email = req.body.email
    var password = req.body.password
    connection.query("insert into info(name,email,password) values (?,?,?)",[name,email,password],function(err,result){
        resp.redirect("/login.html")
        resp.end()
    })

})

app.post("/log",encoder,function(req,resp){
    var email = req.body.email;
    var password = req.body.password;
    connection.query("select * from info where email=? and password=?",[email,password],function(err,result){
        if(result.length>0){
            resp.redirect("/video");
        }
        else{
            resp.redirect("/");
        }
        resp.end();
    });
});

app.get("/register.html",function(req,resp){
    resp.sendFile(__dirname + "/register.html");
})

app.get("/login.html",function(req,resp){
    resp.sendFile(__dirname + "/login.html")
})

// app.get("/welcome.html",function(req,resp){
//     resp.sendFile(__dirname + "/welcome.html")
// })

//app.listen(8080);



/////////////


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/video', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId);
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
  }); 

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})

server.listen(process.env.PORT||3030)