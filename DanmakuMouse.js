/**
 * Danmaku 鼠标事件
 */
Danmaku.prototype.registerSelectHandler = function(handler) {
    var _self = this;
    
    var rect = this.canvas.getBoundingClientRect();
    
    this.canvas.onclick = function(e) {
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        
        _self.instanceQueue.each(function(dm) {
            if(x > dm.x 
                && x < dm.x + dm.danmakuWidth
                && y > dm.y
                && y < dm.y + DanmakuBarrage.HEIGHT) {
                
                handler(dm);
                
                return false;
            }
        });
    };
};
