
function getElementPosition(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
  }
  function getEventLocation(element,event){

    var pos = getElementPosition(element);
    return {
      x: (event.pageX - pos.x),
        y: (event.pageY - pos.y)
    };
  }




let D = new Drawer(800,600);
let T = 30
let Socket = io();
let Name = sessionStorage.getItem("Name");
const Room = window.location.pathname.substring(1);

Socket.on('connect',()=>
{
    Socket.emit('Name',Name);
    Socket.emit('JoinRoom',Room);
    console.log(Socket.id);

})
Socket.on('Scores',(Scores)=>{
    console.log('SCORES!!!')
    const sortable = Object.entries(Scores)
    sortable.sort(([,a],[,b]) => a-b)
    document.getElementById('players').innerHTML = '';
    for(let i = 0;i<sortable.length;i++)
    {
        let PLayNode = document.createElement('div')
        PLayNode.className = 'Player';
        let Rank = document.createElement('h2')
        Rank.className = 'Rank';
        Rank.innerHTML = '#' + i.toString();
        let Name = document.createElement('h2')
        Name.className = 'Name'
        Name.innerHTML = sortable[i][0]
        let Score = document.createElement('h2')
        Score.className = 'Score';
        Score.innerHTML = sortable[i][1].toString() + 'pt';
        PLayNode.appendChild(Rank)
        PLayNode.appendChild(Name)
        PLayNode.appendChild(Score);
        document.getElementById('players').appendChild(PLayNode);
    }


})   

Socket.on('Drawer',(DrawerId)=>{
    console.log('Drawer'+DrawerId);
    console.log(DrawerId == Socket.id);
    if(Socket.id == DrawerId)
    {
        console.log('ITS MEE')
        document.getElementById('Start').style.visibility = 'visible';
        document.getElementById('Tinp').disabled = true;
    }
})

Socket.on('WORD',(Word)=>{
    document.getElementById('Word').innerHTML = Word;
})

document.getElementById('Start').addEventListener('click',(e)=>
{
    D.Canvas.remove();
    D = new Drawer(800,600);
    Socket.emit('Started',Name)
    D.SetupEvents();
    let Timer = T;
    document.getElementById('Start').style.visibility = 'hidden';
    let interval = setInterval(()=>{
        document.getElementById('Timer').innerHTML = Timer.toString();
        Timer -= 1;
        if(Timer < 0)
        {
            clearInterval(interval);
            D.RemoveEvents();
            Socket.emit('EndOfRound',Name);
        document.getElementById('Tinp').disabled = false;
        }
    },1000)
    
})

Socket.on('Started',(N)=>
{
    D.Clear();
    let Timer = T;
    let interval = setInterval(()=>{
        document.getElementById('Timer').innerHTML = Timer.toString();
        Timer -= 1;
        if(Timer < 0)
        {
            clearInterval(interval);
        }
    },1000)
})

Socket.on('IMG',(ImgData)=>{
    var img=new Image();
    img.src = ImgData;
    img.onload = ()=>
    {
        D.Clear();
        D.ctx.drawImage(img,0,0)
    }
})

Socket.on('RoundResults',(RSLT)=>
{
    let PopCont = document.getElementById('PopCont')
    PopCont.style.visibility = 'visible';
    document.getElementById('Pop').classList.add('Scale');

    setTimeout( function() {
        PopCont.style.visibility='hidden';
        document.getElementById('Pop').classList.remove('Scale');
        console.log('HIDE')
    }, 3000);
    document.getElementById('Content').childNodes[1].innerHTML = `The Word Was: ${RSLT.Word}`
    document.getElementById('Content').childNodes[5].innerHTML = RSLT.Next
    document.getElementById('Word').innerHTML = '';
})




function CreateMSG(Content,Sender,Correct)
{
    let MsgDiv = document.createElement('div');
    MsgDiv.className = 'MSG';
    if(Correct)
    {
        MsgDiv.style.backgroundColor = '#2EE59D';
    }
    let SenderName = document.createElement('h2');
    SenderName.innerHTML = Sender + ':';
    SenderName.className = 'ChatName'
    let MsgContent = document.createElement('p');
    MsgContent.innerHTML = Content;
    MsgContent.className = 'MsgCont';

    MsgDiv.appendChild(SenderName);
    MsgDiv.appendChild(MsgContent);
    return MsgDiv;
}


document.getElementById('Tinp').addEventListener('keypress',(e)=>
{
    if(e.key == 'Enter')
    {
        Socket.emit('Msg',document.getElementById('Tinp').value,Name);
        document.getElementById('Tinp').value = '';
    }
})


Socket.on('Msg',(Content,N,Correct)=>
{
    document.getElementById('MSGS').appendChild(CreateMSG(Content,N,Correct));
})