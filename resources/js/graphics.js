var Helper = {
    // detect type to draw element : color (0 green), color and nb (color x 3), money ($ 500)
    // return true if element can be written ?
    // Current displayed elements
    displayed:[],
    sizes:{x:910,y:150},
    uniques:[],
    add:function(title,values,uniqueId){
        if(uniqueId!=null && this.uniques[uniqueId] != null){
            return;
        }
        if(uniqueId!=null){
            this.uniques[uniqueId] = true;
        }
        var y = this.sizes.y;
        if(this.displayed.length > 0){
            y = this.displayed[this.displayed.length-1].getUpperBound()+30;
        }

        var display = this.draws({width:150,x:this.sizes.x,y:y,title:title},values) ;
        this.displayed.push(display);
        return display;
    },
    clear:function(){
        this.uniques = [];
        this.displayed.forEach(function(e){
            e.clear(canvas);
        });
        this.displayed = [];
    },
    _drawCircle:function(x,y,color){
        canvas.beginPath();
        canvas.fillStyle = color;
        canvas.arc(x,y,10,0,2*Math.PI);
        canvas.fill();
        canvas.closePath();
    },
    draw:function(o,x,y){
        switch(o.type){
            case "color":
                // write color and name
                this._drawCircle(x,y,colors[o.color]);
                canvas.font = "15px Arial";
                canvas.fillText(nameColors[o.color],x + 20,y + 6);
                break;
            case "cow":
                this._drawCircle(x,y,colors[o.color]);
                canvas.font = "15px Arial";
                canvas.fillText("X " + o.nb,x + 20,y + 6);
                break;
            case "money":
                canvas.fillText("$ " + o.value,x,y + 6);
                break;
            case "message":
                canvas.fillText(o.value,x,y + 6);
                break;
        }
    },
    createDetector:function(values,typeEvent,sizes,redrawFct){
        return {
            values:values,
            getUpperBound:function(){
                return sizes.y+sizes.height;
            },
            start:function(callback){
                var _self = this;
                 $('#canvas').unbind('click.' + typeEvent).bind('click.' + typeEvent,function(e){
                    var x = Math.max(0,e.offsetX - sizes.x);
                    var y = Math.max(0,e.offsetY-(sizes.y + sizes.offset)+10);
                    if(x == 0 || x >sizes.width ||y == 0 || y >(sizes.height - sizes.offset)){
                     return;
                    }
                    var pos = Math.floor(y/25);
                    if(pos >= _self.values.length){return;}
                    if(redrawFct!=null){
                        _self.clear();
                        redrawFct(pos);
                    }
                    if(callback!=null){
                        callback(_self.values[pos]);
                    }
                });
            },
            stop:function(){
                $('#canvas').unbind('click.' + typeEvent);
            } ,
            clear:function(){
                canvas.clearRect(sizes.x-2,sizes.y-2,sizes.width+4,sizes.height+4);
            }
        };
    },
    // Return an object to manipulate frame
    draws:function(options,values){
        var x = options.x;
        var y = options.y;

        // Size of frame
        var height = ((options.title)?45:0) + (values!=null ? values.length * 25 : 0);
        canvas.fillStyle="black";
        canvas.fillRect(x-2,y-2,options.width+4,height+4);
        canvas.fillStyle="#333388";
        canvas.fillRect(x,y,options.width,height);
        // Data are written after offset. Box size is height - offset
        var offset = 0;
        // write title
        if(options.title){
            canvas.fillStyle = "white";
            canvas.font = "15px Arial";
            var pos = (options.width - canvas.measureText(options.title).width)/2;
            canvas.fillText(options.title,x+pos,y+15);
            offset+=40;
        }
        if(values != null){
            values.forEach(function(v,idx){
                Helper.draw(v,x+20,offset + y+25*idx);
            });
        }
        if(options.selected!=null){
            canvas.fillStyle = colors[values[options.selected].color];
            canvas.fillRect(x+35,y+offset+10+25*options.selected,options.width-45,3);
        }
        return this.createDetector(
            values,
            "test",
            {x:x,y:y,width:options.width,height:height,offset:offset},
                this.createRedraw(options,values)
        );
    },
    createRedraw:function(options,values){
        return function(selected){options.selected = selected;Helper.draws(options,values);};
    } ,
    convert:function(values,typeObject){
        switch(typeObject){
            case "color":
                return values.map(function(v){
                   return {color:v,type:"color"};
                });
            case "cow":
                return values.map(function(nb,color){
                    return {nb:nb,color:color,type:"cow"};
                }).filter(function(o){return o.nb > 0;});
            case "money":
                return values.map(function(val){
                    return {value:val,type:"money"};
                }).filter(function(o){return o.value > 0;});
            case "message":
                return values.map(function(val){
                    return {next:-1,value:val,type:"message"};
                });
        }
    }
};

var Drawer = {
    drawCase:function(caseBoard){
        var x = (caseBoard.position%3)*300 + 10;
        var y = Math.floor(caseBoard.position/3)*200 + 10;

        if(caseBoard.selected == true){
            canvas.fillStyle = "#009933";
            canvas.fillRect(x-3,y-3,296,196);
        }

        // background
        canvas.fillStyle = "#0099CC";
        canvas.fillRect(x,y,290,190);
        canvas.fillStyle = "white";
        canvas.font = "15px Arial";
        var centerX = (290 - canvas.measureText(caseBoard.name).width)/2;
        canvas.fillText(caseBoard.name,x + centerX,y + 180);
        if(caseBoard.action!=""){
            var title = caseBoard.actionInfo !="" ? caseBoard.actionInfo : caseBoard.action;
            centerX = (280 - canvas.measureText(title).width);
            canvas.fillText(title,x + centerX,y + 20);
        }

        // actual playing case
        if(caseBoard.player != null){
            canvas.beginPath();
            canvas.fillStyle = "red";
            canvas.arc(x+150,y+100,40,0,2*Math.PI);
            canvas.fill();
            canvas.closePath();
            canvas.fillStyle = "white";
            canvas.fillText(caseBoard.player,x + 140,y + 100);
        }

        canvas.beginPath();
        canvas.strokeStyle = "white";
        canvas.lineWidth = 3;
        canvas.arc(x + 24,y + 175,12,0,2*Math.PI);
        canvas.stroke();
        canvas.closePath();
        canvas.fillText(caseBoard.cowNumber,x + 20,y + 180);

        this._drawCows(caseBoard.cows,x,y);
    },
    _drawCows:function(cows,x,y){
        var idx = 1;
        var finalPos = [];
        for(var i in cows){
            if(cows[i] > 0){
                canvas.beginPath();
                canvas.fillStyle = colors[i];
                canvas.arc(x + 30,y + idx*30,10,0,2*Math.PI);
                canvas.fill();
                canvas.closePath();
                canvas.font = "15px Arial";
                canvas.fillText("X " + cows[i],x + 50,y + idx*30 + 6);
                finalPos[idx-1] = parseInt(i);
                idx++;
            }
        }
        return finalPos;
    } ,
    refresh:function(cases){
       canvas.clearRect(0,0,905,610);
       cases.forEach(function(c){
        this.drawCase(c);
       },this);
    }
};