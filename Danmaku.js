/**
 * 弹幕系统
 *
 * @param {String} id
 *
 * @author yu
 *
 * var dm = new Danmaku('canvasId');
 *
 * // 弹幕池大小
 * dm.controls.poolSize = 30;
 *
 * // 速度
 * var speed = 1;
 *
 * for(let i=0; i< 1000; i++) {
 *      dm.add('---' + i, '', speed++);
 *      
 *      if(speed > 4) {
 *          speed = 1;
 *      }
 * }
 *
 * dm.start();
 *
 */
'use strict';

function Danmaku(id) {
    this.win = window;
    this.doc = document;
    
    this.animationTimer = 0;
    this.raf = this.win.requestAnimationFrame ||
        this.win.mozRequestAnimationFrame ||
        this.win.webkitRequestAnimationFrame ||
        this.win.msRequestAnimationFrame ||
        this.win.oRequestAnimationFrame;
        
    this.caf = this.win.cancelAnimationFrame ||
        this.win.mozCancelAnimationFrame ||
        this.win.webkitCancelAnimationFrame ||
        this.win.webkitCancelRequestAnimationFrame ||
        this.win.msCancelAnimationFrame ||
        this.win.oCancelAnimationFrame;
    
    this.canvas = this.doc.getElementById(id);
    this.context = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    this.queue = new DanmakuQueue();
    this.instanceQueue = new DanmakuQueue();
    
    this.controls = {
        poolSize: 30
    };
}
Danmaku.prototype = {
    constructor: Danmaku,
    drawAvatar: function(context, dm) {
        if(null === dm.avatar || !dm.avatar.complete) {
            return;
        }
        
        context.drawImage(dm.avatar,
            dm.x,
            dm.y,
            DanmakuBarrage.HEIGHT,
            DanmakuBarrage.HEIGHT);
    },
    drawRoundRect: function(context, dm) {
        // 弹幕前面是头像区域
        var radius = DanmakuBarrage.HEIGHT / 2;
        var beginX = dm.x + DanmakuBarrage.HEIGHT + DanmakuBarrage.MARGIN;
        
        context.save();
        
        context.fillStyle = dm.options.backgroundColor;
        context.beginPath();
        context.moveTo(beginX + radius, dm.y);
        this.context.arc(beginX + radius,
            dm.y + radius,
            radius,
            /*Math.PI * 1.5*/4.71,
            /*Math.PI / 2*/1.57,
            true);
        this.context.lineTo(beginX + radius + dm.textRectWidth,
            dm.y + DanmakuBarrage.HEIGHT);
        this.context.arc(beginX + radius + dm.textRectWidth,
            dm.y + radius,
            radius,
            /*Math.PI / 2*/1.57,
            /*Math.PI * 1.5*/4.71,
            true);
        this.context.fill();
        
        context.restore();
    },
    drawText: function(context, dm) {
        //context.save();
        
        context.font = dm.font;
        context.textBaseline = 'top';
        context.fillStyle = dm.options.color;
        context.fillText(dm.text,
            dm.x + DanmakuBarrage.HEIGHT
                + DanmakuBarrage.MARGIN
                + DanmakuBarrage.HEIGHT / 2
                + DanmakuBarrage.PADDING,
            dm.y + 6);
        
        dm.move();
        
        //context.restore();
    },
    add: function(text, avatarImage, speed, color) {
        var y = Math.floor(Math.random() * (this.height - DanmakuBarrage.HEIGHT));
        
        this.queue.put(new DanmakuBarrage(
            this.context,
            text,
            avatarImage,
            this.width,
            y,
            {
                speed: speed,
                color: color
            }
        ));
    },
    // 开始弹幕服务
    start: function() {
        var _self = this;
        var dm = null;
        
        // 填充激活队列
        while(this.queue.size > 0
            && this.instanceQueue.size < this.controls.poolSize) {
            
            this.instanceQueue.put(this.queue.take());
        }
        
        // 清空画布
        this.context.clearRect(0, 0, this.width, this.height);
        
        // 渲染激活队列
        while(null !== (dm = this.instanceQueue.iterator())) {
            //avatar
            this.drawAvatar(this.context, dm);
            
            // bg
            this.drawRoundRect(this.context, dm);
            
            // text
            this.drawText(this.context, dm);
        }
        
        // 检查激活节点状态
        while(null !== (dm = this.instanceQueue.iterator())) {
            if(dm.isDead) {
                this.instanceQueue.remove(dm);
            }
        }
        
        this.animationTimer = this.raf.call(this.win, function() {
            _self.start();
        });
    }
};

/**
 * 弹幕
 *
 * @param {Object} context
 * @param {String} text
 * @param {String} avatarImage
 * @param {Number} x
 * @param {Number} y
 * @param {Object} options
 */
function DanmakuBarrage(context, text, avatarImage, x, y, options) {
    this.isDead = false;
    
    this.context = context;
    this.text = text;
    this.avatarImage = avatarImage;
    this.x = x;
    this.y = y;
    
    this.avatar = null;
    this.textWidth = 0;
    this.textRectWidth = 0;
    this.danmakuWidth = 0;
    
    this.options = {
        speed: 1,
        color: '#111',
        font: new DanmakuFont(14, 'Microsoft Yahei').toString(),
        backgroundColor: 'rgba(255, 255, 255, .6)'
    };
    
    this.init(options);
}
DanmakuBarrage.MARGIN = 10;
DanmakuBarrage.PADDING = 5;
DanmakuBarrage.HEIGHT = 30;
DanmakuBarrage.prototype.extend = function(origin, options) {
    for(var k in options) {
        if(undefined !== options[k]) {
            origin[k] = options[k];
        }
    }
};
DanmakuBarrage.prototype.move = function() {
    this.x = this.x - this.options.speed;
        
    if(this.x < -this.danmakuWidth) {
        this.isDead = true;
    }
};
DanmakuBarrage.prototype.init = function(options) {
    if(undefined !== options) {
        this.extend(this.options, options);
    }
    
    if(undefined !== this.avatarImage
        && '' !== this.avatarImage
        && null !== this.avatarImage) {

        this.avatar = new Image();
        this.avatar.src = this.avatarImage
    }
    
    //this.context.save();
    
    this.context.font = this.options.font;
    this.textWidth = Math.ceil(this.context.measureText(this.text).width);
    this.textRectWidth = this.textWidth + DanmakuBarrage.PADDING * 2;
    // imageWidth + margin + textRectWidth + textRectRadius * 2
    this.danmakuWidth = DanmakuBarrage.HEIGHT
        + DanmakuBarrage.MARGIN
        + this.textRectWidth
        + DanmakuBarrage.HEIGHT;
    
    //this.context.restore();
};

/**
 * font
 */
function DanmakuFont(fontSize, fontFamily) {
    this.fontSize = fontSize;
    this.fontFamily = fontFamily;
}
DanmakuFont.prototype.toString = function(){
    return this.fontSize + 'px ' + this.fontFamily;
};

/**
 * 队列
 */
function DanmakuQueue() {
    this.headNode = null;
    this.tailNode = null;
    this.size = 0;
    
    this.currentIteratorNode = null;
}
DanmakuQueue.prototype = {
    constructor: DanmakuQueue,
    put: function(data) {
        var node = new DanmakuQueue.Node(data, null);
        
        if(0 === this.size) {
            this.headNode = node;
            
        } else {
            this.tailNode.next = node;
        }
        
        this.tailNode = node;
        
        this.size++;
    },
    take: function() {
        // 为空直接返回
        if(0 === this.size) {
            return null;
        }
        
        var data = this.headNode.data;
        var tmpHeadNode = this.headNode;
        
        // 从队列去除头节点
        this.headNode = tmpHeadNode.next;
        tmpHeadNode.next = null;
        tmpHeadNode = null;
        
        // 没节点了
        if(null === this.headNode) {
            this.headNode = this.tailNode = null;
        }
        
        this.size--;
        
        return data;
    },
    iterator: function() {
        if(null === this.currentIteratorNode) {
            this.currentIteratorNode = this.headNode;
            
        } else {
            this.currentIteratorNode = this.currentIteratorNode.next;
        }
        
        return null === this.currentIteratorNode
            ? (this.currentIteratorNode = null, null)
            : this.currentIteratorNode.data;
    },
    each(callback) {
        for(var current = this.headNode; null !== current; current = current.next) {
            if(false === callback(current.data)) {
                break;
            }
        }
    },
    remove: function(data) {
        var current = this.headNode;
        var previous = null;
        
        for(; null !== current; previous = current, current = current.next) {
            if(data !== current.data) {
                continue;
            }
            
            // 删除头结点
            if(null === previous) {
                this.headNode = current.next;
            }
            
            // 删除非头结点
            if(null !== previous) {
                previous.next = current.next;
            }
            
            // 尾节点
            if(null === current.next) {
                this.tailNode = previous;
            }
            
            // 清除当前节点
            current.next = null;
            current = null;
            
            this.size--;
            
            break;
        }
    },
    toArray: function() {
        var ret = new Array(this.size);
        
        var i = 0;
        var current = null;
        for(current = this.headNode; null !== current; current = current.next) {
            ret[i] = current.data;
            i++;
        }
        
        return ret;
    },
    clear: function() {
        while(0 !== this.size) {
            this.take();
        }
    }
};
DanmakuQueue.Node = function(data, next) {
    this.data = data;
    this.next = next;
};

