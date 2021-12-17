




class Drawer
{ 
    constructor(W,H)
    {
        this.Canvas = document.createElement("canvas");
        this.ctx = this.Canvas.getContext("2d");
        this.backup = []
        this.Funcs = []
        this.isDrawing = false
        this.Tool = 1 //pen:1 Fill:2
        this.Canvas.width = W;
        this.Canvas.height = H;
        this.ctx.lineWidth = 10;
        this.ctx.strokeStyle = "#000000";
        document.getElementById("Draw").prepend(this.Canvas);
        this.backup.push(this.ctx.getImageData(0,0,W,H));
        

    }
    
    SetupEvents()
    {
        this.Funcs = [];
        this.Funcs.push((e)=>{this.ctx.strokeStyle = document.getElementById("CPick").value;console.log('COLOR CHANGED') });
        document.getElementById("CPick").addEventListener("change",this.Funcs[0])
        this.Funcs.push((e)=>{this.ctx.lineWidth = document.getElementById("TPick").value });
        document.getElementById("TPick").addEventListener("change",this.Funcs[1])
        this.Funcs.push((e)=>{this.isDrawing = false;});
        this.Canvas.addEventListener("mouseleave",this.Funcs[2])
        this.Funcs.push((e)=>
        {
            if(this.isDrawing && this.Tool == 1)
            {
            var eventLocation = getEventLocation(this.Canvas,e);
            this.Draw(eventLocation['x'],eventLocation['y']);
            }
        });

        this.Canvas.addEventListener("mousemove",this.Funcs[3])
        this.Funcs.push((e)=>{
            this.backup.push(this.ctx.getImageData(0,0,this.Canvas.width,this.Canvas.height));
            if(this.Tool == 1)
            {
                this.isDrawing = true; 
            }
            else if(this.Tool == 2)
            {
                var eventLocation = getEventLocation(this.Canvas,e);
                
                this.Fill(eventLocation['x'],eventLocation['y']);
            }
        });
        this.Canvas.addEventListener("mousedown",this.Funcs[4]);
        this.Funcs.push((e)=>{this.isDrawing = false;this.ctx.beginPath();});
        this.Canvas.addEventListener("mouseup",this.Funcs[5]);

        this.Funcs.push((e)=>
        {
        if (e.key === '\x1A') //ctrl + z
        {
            let Img = this.backup.pop()
            if(Img)
            {
                this.ctx.putImageData(Img,0,0);
                Socket.emit('IMG',this.Canvas.toDataURL());
            }
        
        }
        else
        {
            this.Tool = 2;
            this.ctx.lineWidth = 2;

        }
        })
        document.body.addEventListener('keypress',this.Funcs[6])
    }

    RemoveEvents()
    {
        console.log("Events removed");
        document.getElementById("CPick").removeEventListener("change",this.Funcs[0])
        document.getElementById("TPick").removeEventListener("change",this.Funcs[1])
        this.Canvas.removeEventListener("mouseleave",this.Funcs[2])
        this.Canvas.removeEventListener("mousemove",this.Funcs[3])
        this.Canvas.removeEventListener("mousedown",this.Funcs[4]);
        this.Canvas.removeEventListener("mouseup",this.Funcs[5]);

        document.body.removeEventListener('keypress',this.Funcs[6])
    }

    Clear()
    {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0,0,this.Canvas.width,this.Canvas.height);
    }

    Fill(x,y)
    {
        let data = this.ctx.getImageData(x, y, 1, 1).data;
        let rgba = [ data[0], data[1], data[2],data[3] ];
        let V = new Array(this.Canvas.height)
        for(let i = 0;i<this.Canvas.height;i++)
        {
            let Arr = new Array(this.Canvas.width).fill(false);
            V[i] = Arr; 
        }
        this.DPS(x,y,rgba,V);
        Socket.emit('IMG',this.Canvas.toDataURL());

    }
    DPS(x,y,rgba,visited)
        {
            this.Draw(x,y,false)
            visited[x][y] = true

            let Dirs = [[0,1],[0,-1],[1,0],[-1,0],[0,2],[0,-2],[2,0],[-2,0]];
            for(let i = 0; i < Dirs.length;i++)
            {
                let Dir = Dirs[i]
                //console.log(Dir)
                if(x+Dir[0] >= 0 && x+Dir[0] <= this.Canvas.width && y+Dir[1] >= 0 && y+Dir[1] <= this.Canvas.height)
                {
                    //console.log("IN RANGE")
                    let data = this.ctx.getImageData(x+Dir[0], y+Dir[1], 1, 1).data;
                    let CurrRgba = [ data[0], data[1], data[2],data[3] ];
                    //console.log("Color: " + CurrRgba)
                    //console.log('VISITED: ' +visited[x+Dir[0]][y+Dir[1]])
                    if(rgba[0] == CurrRgba[0] && rgba[1] == CurrRgba[1] && rgba[2] == CurrRgba[2] && rgba[3] == CurrRgba[3])
                    {
                        if(!visited[x+Dir[0]][y+Dir[1]])
                        {
                            //console.log("Called")
                            this.DPS(x+Dir[0],y+Dir[1],rgba,visited);
                        }
                    }
                }
            }

        }
    


    Draw(x,y, UpdateServer = true)
    {
        this.ctx.lineCap = "round";
        this.ctx.lineTo(x,y);
        this.ctx.stroke();
        if(UpdateServer)
        {
            Socket.emit('IMG',this.Canvas.toDataURL());
        }
    }
}

