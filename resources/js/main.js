var canvas;
var colors =  ["#1C2341","#E77407","#96C765","#F5F5F5"] ;
var nameColors =  ["Black","Orange","Green","White"] ;

$(function(){
    canvas = document.getElementById('canvas').getContext('2d');
    Message.init("#idMessage");
});

var Status = {
    ok:function(id){
        $('.status>span:first').css('backgroundColor','green');
        $('.status>span:last').html('connected to game ' + id);
    },
    ko:function(){
        $('.status>span:first').css('backgroundColor','red');
        $('.status>span:last').html('error');
    },
    connecting:function(){
        $('.status>span:first').css('backgroundColor','orange');
        $('.status>span:last').html('connecting...');
    }
};
