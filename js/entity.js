

entity = function(id, userid) {
    this.pos = {
        x: 0,
        y: 0
    };
    this.vel = {
        x: 0,
        y: 0
    };
    this.id = id;
    this.state = "alive";
    this.size = {
        x: 10,
        y: 10
    }
    this.userid = userid;
};

gamePlayer.prototype.update = function() {
    
};