const { Console } = require('console');
const express = require('express');
var path = require('path');
const app = express();
const port = 5000;
let RoomSet = new Set();
let PlayersNames = {}
let Games = {}
const { v4: uuidV4 } = require('uuid')
const RandomWord = require('word-pictionary-list');

let Server = app.listen(port ,()=>console.log(`Listening on ${port}`));

const io = require('socket.io')(Server);

app.use(express.static('./Client'))
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'./Client/Home.html')));

app.get('/404',(req,res)=>res.sendFile(path.join(__dirname,'./Client/NoRoom.html')));


    app.get('/NewRoom',(req,res)=>
    {
        let Room = uuidV4();
        RoomSet.add(Room);
        Games[Room] = {};
        Games[Room]['Q'] = [];
        Games[Room]['Q2'] = [];
        Games[Room]['Drawer'] = null;
        Games[Room]['Scores'] = {} 
        res.redirect(`/${Room}`);
    })

    app.get('/:room', (req, res) => {
        if(RoomSet.has(req.params.room))
        {
          res.sendFile(path.join(__dirname,'./Client/Canv.html'))
        }
        else
        {
          res.redirect('/404');
        }
      })


io.on('connection', (Socket)=>
{ 
    
    Socket.on('IMG',(IMG)=>{
        Socket.broadcast.emit('IMG',IMG)
    })
    Socket.on('JoinRoom',(RoomId)=>{
      
      PlayersNames[Socket.id]['Room'] = RoomId;
      Socket.join(RoomId);
      Games[RoomId]['Q'].push(Socket.id);
      Games[RoomId]['Scores'][PlayersNames[Socket.id]['Name']] = 0;
      console.log(Games[RoomId]);
      if(Games[RoomId]['Q'].length == 1 && Games[RoomId]['Drawer'] == null)
      {
        console.log('FIRST')
        Drawer = Games[RoomId]['Q'].shift()
        Games[RoomId]['Drawer'] = Drawer;
        Games[RoomId]['Q2'].push(Drawer);
        Games[RoomId]['WORD'] = RandomWord();
        PlayersNames[Games[RoomId]['Drawer']]['Socket'].emit('WORD',Games[RoomId]['WORD']);
      }
      Socket.emit('Drawer',Games[RoomId]['Drawer']);
      Socket.broadcast.to(RoomId).emit('Plauers', Games[RoomId]['Scores']);
      Socket.broadcast.to(RoomId).emit('Scores', Games[RoomId]['Scores']);
      Socket.emit('Scores', Games[RoomId]['Scores']);

    })
    Socket.on('Started',(N)=>
    {
      let RoomId = PlayersNames[Socket.id]['Room'];
      Socket.broadcast.to(RoomId).emit('Started',N);
    })
    Socket.on('EndOfRound',(N)=>
    {
      let RoomId = PlayersNames[Socket.id]['Room'];
      Socket.emit('Scores', Games[RoomId]['Scores']);
      Socket.broadcast.to(RoomId).emit('Scores', Games[RoomId]['Scores']);
      if(Games[RoomId]['Q'].length == 0)
      {
        Games[RoomId]['Q'] = Games[RoomId]['Q2']
        Games[RoomId]['Q2'] = []
      }
      Drawer = Games[RoomId]['Q'].shift()
      Games[RoomId]['Drawer'] = Drawer;
      Games[RoomId]['Q2'].push(Drawer);
      Socket.emit('Drawer',Games[RoomId]['Drawer']);
      Socket.broadcast.to(RoomId).emit('Drawer',Games[RoomId]['Drawer']);
      RSLT = {
        Next:PlayersNames[Games[RoomId]['Drawer']]['Name'],
        Word:Games[RoomId]['WORD']
      }
      console.log(RSLT);
      Socket.broadcast.to(RoomId).emit('RoundResults',RSLT);
      Socket.emit('RoundResults',RSLT);
      Games[RoomId]['WORD'] = RandomWord();
      PlayersNames[Games[RoomId]['Drawer']]['Socket'].emit('WORD',Games[RoomId]['WORD']);
    })
    Socket.on('Name',(Name)=>
    {
        PlayersNames[Socket.id] = {'Name':Name,'Socket':Socket}; 
        console.log(Socket.id + ' Connected as ' + Name)
      

    });
    
    Socket.on('Msg',(Content,Name)=>
    {
      let RoomId = PlayersNames[Socket.id]['Room'];
      let Gess = false
      if(Content.toLowerCase() == Games[RoomId]['WORD'].toLowerCase())
      {
        Gess = true
        Content = 'Gessed it'
        Games[RoomId]['Scores'][Name] += 100
        Games[RoomId]['Scores'][PlayersNames[Games[RoomId]['Drawer']]['Name']] += 100
        
        console.log( Games[RoomId]['Scores'])
      }
      Socket.emit('Msg',Content,Name,Gess)
      Socket.broadcast.to(RoomId).emit('Msg',Content,Name,Gess);

    })



    Socket.on("disconnecting",()=>{
      let Name = PlayersNames[Socket.id]['Name']
      console.log(`${Name} disconnected`);
      let RoomId = PlayersNames[Socket.id]['Room'];
      delete Games[RoomId]['Scores'][Name];
      Socket.broadcast.to(RoomId).emit('Scores', Games[RoomId]['Scores']);

    })
    
})



