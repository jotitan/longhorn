var GameManager = {
    idUser:null,
    idGame:null,
    cases:null,
    currentCase:null,
    treatMessage:function(data){
        Message.show("");
        Helper.clear();
        //redraw cases
        this.cases = this._extractDatas(data);
        this.currentCase = data.CurrentCase;
        Drawer.refresh(this.cases);
        PlayerManager.refresh(data);

        if(data.Action == "win"){
            // Win and begin are managed as same
            data.Action = "begin";
            Message.show(data.Winner + " win : " + data.Info);
        }

        // manage action if is user
        if(this.idUser == data.NextPlayer){
            Message.append("It's your turn");
            var c = this.getCase(data.CurrentCase);
            this.actions(data,c);
        }
    },
    getLastColor:function(){
        var color = -1;
        this.getCase(this.currentCase).cows.forEach(function(v,i){if(v>0){color=i;}});
        return color;
    },
    sendUserAction:function(action,data){
        var dataRequest = {CasePos:this.currentCase,Player:this.idUser,GameId:this.idGame};
        if(data.next!=null){
            dataRequest.NextCasePos = data.next;
        }
        switch(action){
            case "money":
                dataRequest.Color = data.color;
                //dataRequest.NextCasePos = data.next;
                dataRequest.Info = {};
                break;
            case "replay":
                dataRequest.Color = data.color;
                //dataRequest.NextCasePos = data.next;
                dataRequest.Info = {};
                break;
            case "swallow":
                dataRequest.Color = data.selcolor;
                dataRequest.NextCasePos = null;
                dataRequest.Info = {
                    CasePos:data.next,
                    Color:data.color
                };
                break;
            case "killcolor":
                dataRequest.Color = data.selcolor;
                dataRequest.Info = {
                   Color:data.color
                };
                break;
            case "snake":
                dataRequest.Color = data.selcolor;
                dataRequest.Info = {
                    Cases:data.colors
                };
                break;
            case "stole":
                dataRequest.Color = data.selcolor;
                //dataRequest.NextCasePos = data.next;
                dataRequest.Info = {
                    CasePos:data.next,
                    // If money is selected instead of color, Color is -1
                    Color:data.color!=null ? data.color:-1
                };
                break;
            case "begin":
                //dataRequest.NextCasePos = data.next;
                dataRequest.Color = -1;
                break;
            default:
                dataRequest.Color = data.color;
                //dataRequest.NextCasePos = data.next;
                break;
        }
        console.log("Send",dataRequest);
        $.ajax({
            url:"event",
            method:"POST",
            data:{event:JSON.stringify(dataRequest)},
            success:function(data){

            }
        });
    },
    create:function(data){
        this.idGame = data.Id;
        this.connect(data.Id);
    },
    connect:function(id,nbTry){
        Status.connecting();
        var serverConnect = new EventSource('/connect?idGame=' + id);
        serverConnect.onmessage = function(data){
            Status.ok(id);
            console.log("Receive",data.data);
            GameManager.treatMessage(JSON.parse(data.data));
        };

        serverConnect.onerror = function(data){
            Status.ko();
            serverConnect.close();
            if(nbTry == null || nbTry < 10){
            // Try to reconnect
                setTimeout(function(){
                    GameManager.connect(id,nbTry!=null ? nbTry+1:1);
                },1000);
            }
        };

        serverConnect.addEventListener('info',function(data){
            Message.append(data.data);
        });

        serverConnect.addEventListener('userid',function(data){
            GameManager.idUser = parseInt(data.data);
        });
    },
    checkCaseNotEmpty:function(pos){
        var c = this.getCase(pos);
        return c.cows.some(function(n){return n > 0;});

    },
    getCase:function(posCase){
        return this.cases.find(function(c){return c.position == posCase});
    },
    _extractDatas:function(data){
        var cases = [];
        data.Cases.forEach(function(c){
            cases.push({
                position:c.Position,
                name:c.Name,
                action:c.Action,
                actionInfo:c.ActionInfo,
                cows:c.Cows,
                cowNumber:c.Nb,
                player:c.Position == data.CurrentCase ? data.NextPlayer == GameManager.idUser ? "Me":"":null
            });
        });
        return cases;
    } ,
    draw:function(){
        Drawer.refresh(this.cases);
    } ,
    _selectCase:function(params,results,action,callback){
        var color = (results.selcolor!=null)?results.selcolor:results.color;
        if(params.Moves[color].length > 0){
            Helper.add("Select case",null,"unique.select.case");
            Detector.runDetectCase(params.Moves[color],function(data){
                $.extend(results,data);
                GameManager.sendUserAction(action,results);
                Helper.clear();
                if(callback!=null){
                    callback();
                }
            });
        }else{
            var act = Helper.add("Select case",Helper.convert(["No move available"],"message"),"unique.select.case");
            act.start(function(data){
                $.extend(results,data);
                GameManager.sendUserAction(action,results);
                Helper.clear();
                if(callback!=null){
                    callback();
                }
            });
        }
    },
    // Begin of use selector. Can be just color, just case or both
    actions:function(params,currentCase){
        var colors = currentCase!=null ? currentCase.cows:null;
        var _self = this;

        switch(params.Action){
            case "move" :
                Message.append("Select next case");
                // When previous action modify board, select move after
                Helper.add("Select case",null);
                Detector.runDetectCase(params.Moves["0"],function(data){
                    GameManager.sendUserAction("",data);
                });
                break;
            case "stole":
                Message.append("Stole your opponent");
                // color selected auto, stole cow or money (list), choose next case
                Helper.add("Color selected",Helper.convert(colors,"cow"));
                var results = {selcolor:GameManager.getLastColor()};
                var stoled = PlayerManager.getOtherStoleInfo();
                if(stoled.cows.some(function(nb){return nb > 0;}) || stoled.money != 0){
                    var values = [];
                    Helper.convert(stoled.cows,"cow").forEach(function(o){values.push(o);});
                    Helper.convert([stoled.money],"money").forEach(function(o){values.push(o);});
                    var act = Helper.add("Stole something",values);
                    act.start(function(data){
                        $.extend(results,data);
                        _self._selectCase(params,results,params.Action,function(){act.stop();});
                    });
                } else{
                    this._selectCase(params,results,params.Action);
                }
                break;
            case "swallow" :
                Message.append("Stole cows on adjacent cell");
                Helper.add("Color selected",Helper.convert(colors,"cow"));
                Helper.add("Select case",null);

                // select neibourgh case and color. Next case decided after
                var results = {selcolor:GameManager.getLastColor()};
                Detector.runDetectCase(params.Neighbors,function(data){
                    $.extend(results,data);
                    var act = Helper.add("Select color",Helper.convert(GameManager.getCase(data.next).cows,"cow"));
                    act.start(function(data){
                        $.extend(results,data);
                        Helper.clear();
                        GameManager.sendUserAction(params.Action,results);
                   });
                });
                break;
            case "killcolor" :
                 Message.append("You have to kill a cow color");
                 Helper.add("Color selected",Helper.convert(colors,"cow"));
                 var act = Helper.add("Kill color",Helper.convert([0,1,2,3],"color"));
                 act.start(function(data){
                     var results = {selcolor:GameManager.getLastColor()};
                     $.extend(results,data);
                     Helper.clear();
                     GameManager.sendUserAction(params.Action,results);
                 });
                break;
            case "begin" :
                Message.append("Place your opponent on board");
                // select first placement of player
                Helper.add("Select case",null);
                Detector.runDetectCase(params.Neighbors,function(data){Helper.clear();GameManager.sendUserAction(params.Action,data);});
                break;
            case "snake" :
                Message.append("That's a snake, loose one cow of each color");
                // Case action, take the last colors
                Helper.add("Color selected",Helper.convert(colors,"cow"));
                var results = {selcolor:GameManager.getLastColor()};
                results.colors = {};
                this.chooseManyCases(0,params.Colors,params.Neighbors,results);
                break;
            case "replay" :
                Message.append("You will replay");
                //break;
            case "money" :
                Message.append("You win some money !");
                //break;
            default:
                // select color, select case, no cation
                var act = Helper.add("Select color",Helper.convert(colors,"cow"));
                act.start(function(results){
                    _self._selectCase(params,results,params.Action,function(){act.stop();});
                });
        }
    },
    chooseManyCases:function(currentColor,colors,moves,results){
        if(currentColor>=colors.length){
            Helper.clear();
            return GameManager.sendUserAction("snake",results);
        }
        var _self = this;
        // Possible to place on empty case
        if(colors[currentColor] == 1){
            Helper.add("Place color",Helper.convert([currentColor],"color"));
             Detector.runDetectCase(moves,function(data){
                results.colors[currentColor] = data.next;
                _self.chooseManyCases(currentColor+1,colors,moves,results);
             },true );
        } else{
            this.chooseManyCases(currentColor+1,colors,moves,results);
        }
    },
};

var Message = {
    panel:null,
    init:function(id){
        this.panel = $(id);
    },
    show:function(message){
        this.panel.html(message);
    },
    append:function(message){
        this.panel.html(this.panel.html() + "<br/>" + message);
    }

};

var GameCreator = {
    join:function(id,name){
        this._load('/join?idGame=' + id + ((name!=null)?'&name=' + name:''));
    },
    create:function(name){
        this._load('/join?name=' + name);
    },
    _load:function(url){
         $.ajax({
            url:url,
            success:function(data){
                $('#idPanelGame').show();
                $('#idJoinPanel').hide();
                Message.append("Load game with id " + data.Id);
                location
                var link = location.origin + "/?id=" + data.Id;
                Message.append('Share link : <a href="' + link + '">' + link + '</a>');
                GameManager.create(data);
            }
          });
    },
    // Load game if field id is present in url
    init:function(){
        var searchId = new RegExp(/id=(\d+)/).exec(location.search);
        if(searchId!=null && searchId.length == 2){
            this.join(parseInt(searchId[1]));
        }
        return this;
    }
}.init();

var Detector = {
    runDetectCase:function(moves,clickAction,canBeEmpty){
        if(moves == null || moves.length == 0){
            return false;
        }
        var _selfMouse = this;
        $('#canvas').unbind('mousemove.detectcase').bind('mousemove.detectcase',function(e){
            if(e.offsetX > 905){return;}
            var caseOn = Math.floor((e.offsetY-10)/200)*3 + Math.floor((e.offsetX-10)/300);
            if(_selfMouse.selectedCase!=null && _selfMouse.selectedCase.position == caseOn){
                return
            }
            // check if case can be selected : belong to list and not empty
            if(moves != null){
                if(!moves.some(function(pos){return pos == caseOn})){
                    return;
                }
            }
            if(canBeEmpty == null && !GameManager.checkCaseNotEmpty(caseOn)){
                // No enough cows on this case
                return;
            }
            if(_selfMouse.selectedCase!=null){
               _selfMouse.selectedCase.selected = false;
            }
            _selfMouse.selectedCase = GameManager.getCase(caseOn);
            _selfMouse.selectedCase.selected = true;
            GameManager.draw();
        });
        $('#canvas').unbind('click.detectcase').bind('click.detectcase',function(e){
           if(e.offsetX > 905){return;}
           var caseOn = Math.floor((e.offsetY-10)/200)*3 + Math.floor((e.offsetX-10)/300);
           if(moves != null){
                if(!moves.some(function(pos){return pos == caseOn})){
                    return;
                }
           }
           if(canBeEmpty == null && !GameManager.checkCaseNotEmpty(caseOn)){
                return;
           }
           $('#canvas').unbind('mousemove.detectcase').unbind('click.detectcase');
           if(clickAction!=null){
                clickAction({next:caseOn});
           }
        });
        return true;
    }
};