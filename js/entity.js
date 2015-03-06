

entity = function(id, userid, type, size) {
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
    this.size = {x: size.x, y: size.y};
    this.userid = userid;
    this.type = type;
};

gamePlayer.prototype.update = function() {
    
};