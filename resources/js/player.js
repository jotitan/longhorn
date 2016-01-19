var PlayerManager = {
    p1:null,
    p2:null,
    isMe:function(){
        return this.p1!=null && this.p1.Id == GameManager.idUser;
    },
    getOtherUser:function(){
        if(this.p1!=null && this.p1.Id == GameManager.idUser){
            return this.p2;
        }
        return this.p1;
    },
    getOtherStoleInfo:function(){
        // return highest money and cows by color limited to 2
        var player = this.getOtherUser();
        return {
            money:player.Moneys!=null ? player.Moneys.reduce(function(max,val){if(val > max){return val;} return max;},0):0,
            cows:player.Cows.map(function(v){return Math.min(v,2);})
        };
    },
    refresh:function(data){
        this.p1 = data.P1;
        this.p2 = data.P2;
        this.showUser('idPlayer1',data.P1);
        this.showUser('idPlayer2',data.P2);
    },
    showUser:function(idUser,player){
        var div = $('#' + idUser);
        div.empty();
        var style=(GameManager.idUser == player.Id)?";color:red;font-weight:bold":"";
        div.append('<h3 style="padding-left:20px;' + style + '">' + player.Name + ' (Point : ' + player.Point + ')</h3>');
        var cows = $('<div style="float:left;padding:10px 30px;border-right:solid 1px black;">Cows<hr/></div>');
        div.append(cows);
        var moneys = $('<div style="float:left;padding:10px 30px;">Money<hr/></div>');
        div.append(moneys);
        for(var c in player.Cows){
            if(player.Cows[c] > 0){
                cows.append('<span style="background-color:' + colors[c] + ';display:inline-block;height:15px;margin-right:5px;width:15px;border:solid 1px black;"></span> X ' + player.Cows[c] + "<br/>");
            }
        }
        for(var m in player.Moneys){
            moneys.append('$ ' + player.Moneys[m] + '<br/>');
        }
    }
} ;