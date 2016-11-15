/*!
 * FDrag.js 1.2 - drag element animation
 * demo http://www.funwewhere.com/FDrag.html
 * MIT licensed
 *
 * Copyright (C) 2016 funwewhere, http://www.funwewhere.com
 */
(function(){

    "use strict";

    var IS_TOUCH_DEVICE = !!( 'ontouchstart' in window );

    // All of the lists that are currently bound
    var lists = [];

    // Set to true when there are lists to refresh
    var active = false;

    /**
     * Updates all currently bound lists.
     */
    function refresh() {
        if( active ) {
            requestAnimFrame( refresh );
            active = false;
            for( var i = 0, len = lists.length; i < len; i++ ) {
                if (lists[i].needUpdate()) {
                    active = true;
                }
                lists[i].element.style.webkitTransform = 'translate('+ lists[i].move.nowX +'px, ' + lists[i].move.nowY + 'px) scale(' + lists[i].scale.value + ', ' + lists[i].scale.value + ')';
            }
        }
    }

    function add( element, options ) {
        if ( IS_TOUCH_DEVICE ) {
            // Delete duplicates (but continue and re-bind this list to get the
            // latest properties and list items)
            if( contains( element ) ) {
                remove( element );
            }

            var dragObject = new DragObject(element, options);

            dragObject.bind();
            // Add this element to the collection
            lists.push(dragObject);

            return dragObject;
        } else{
            throw "this isn't a touch device";
        }
    }

    /**
     * Stops monitoring a list element and removes any classes
     * that were applied to its list items.
     *
     * @param {HTMLElement} element
     */
    function remove( element ) {
        for( var i = 0; i < lists.length; i++ ) {
            var list = lists[i];

            if( list.element == element ) {
                list.destroy();
                lists.splice( i, 1 );
                i--;
            }
        }

        // Stopped refreshing if the last list was removed
        if( lists.length === 0 ) {
            active = false;
        }
    }

    /**
     * Checks if the specified element has already been bound.
     */
    function contains( element ) {
        for( var i = 0, len = lists.length; i < len; i++ ) {
            if( lists[i].element == element ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calls 'method' for each DOM element discovered in
     * 'target'.
     *
     * @param target String selector / array of UL elements /
     * jQuery object / single UL element
     * @param method A function to call for each element target
     */
    function batch( target, method, options ) {
        var i, len;

        // Selector
        if( typeof target === 'string' ) {
            var targets = document.querySelectorAll( target );

            for( i = 0, len = targets.length; i < len; i++ ) {
                return method.call( null, targets[i], options );
            }
        }
        // Array (jQuery)
        else if( typeof target === 'object' && typeof target.length === 'number' ) {
            for( i = 0, len = target.length; i < len; i++ ) {
                return method.call( null, target[i], options );
            }
        }
        // Single element
        else if( target.nodeName ) {
            return method.call( null, target, options );
        }
        else {
            throw 'Stroll target was of unexpected type.';
        }
    }

    /**
     * Checks if the client is capable of running the library.
     */
    function isCapable() {
        return !!document.body.classList;
    }

    function DragObject( element, option) {
        this.element = element;
        this.direction = option && option.direction || 'all';
        this.maxX = option && option.maxX || null;
        this.minX = option && option.minX || null;
        this.maxY = option && option.maxY || null;
        this.minY = option && option.minY || null;
        this.scaleFn = option && option.scaleFn;
        this.touchEndFn = option && option.touchEndFn;

        this.move = {
            nowX : 0,
            nowY : 0,
            lastX : 0,
            lastY : 0,
        }

        this.touch = {
            X: 0,
            Y: 0,
            offsetX: 0,
            offsetY: 0,
            startX: 0,
            startY: 0,
            previousX: 0,
            previousY: 0,
            isActive: false
        };

        this.scale = {
            isChange : false,
            value : 1,
            max : 1,
            min : 0.03,
            rate : 0.78,
            callback : null
        }

        this.elastic = {
            direction : 'all',
            friction : 1,
            callback : null,
            k : 0.01,
            X : {
                isChange : false,
                velocity : 0,
                initDirection : 0,
                balancePosition :0,
                isSpringback : false,
                acceleration : 0,
                offset : 0,
                allPower : 0
            },
            Y : {
                isChange : false,
                velocity : 0,
                initDirection : 0,
                balancePosition :0,
                isSpringback : false,
                acceleration : 0,
                offset : 0,
                allPower : 0
            }
        }

    }

    DragObject.prototype = {
        setInfo : function(offsetX, offsetY, scale){
            this.move.nowX = offsetX != null ? offsetX : this.move.nowX;
            this.move.nowY = offsetY != null ? offsetY :  this.move.nowY;
            this.scale.value = scale != null ? scale :  this.scale.value;
            this.element.style.webkitTransform = 'translate('+ this.move.nowX +'px, ' + this.move.nowY + 'px) scale(' + this.scale.value + ', ' + this.scale.value + ')';
        },
        bind : function() {
            var scope = this;

            this.touchStartDelegate = function( event ) {
                scope.onTouchStart( event );
            };

            this.touchMoveDelegate = function( event ) {
                scope.onTouchMove( event );
            };

            this.touchEndDelegate = function( event ) {
                scope.onTouchEnd( event );
            };

            this.element.addEventListener( 'touchstart', this.touchStartDelegate, false );
            this.element.addEventListener( 'touchmove', this.touchMoveDelegate, false );
            this.element.addEventListener( 'touchend', this.touchEndDelegate, false );
        },
        onTouchStart : function( event ) {
            event.preventDefault();

            var touches = event.touches;

            if (touches.length == 1) {
                this.move.lastX = this.move.nowX;
                this.move.lastY = this.move.nowY;
                this.touch.X = touches[0].clientX;
                this.touch.Y = touches[0].clientY;
                this.touch.startX = this.touch.X;
                this.touch.startY = this.touch.Y;
                this.touch.previousX = this.touch.X;
                this.touch.previousY = this.touch.Y;
                this.touch.offsetX = 0;
                this.touch.offsetY = 0;
                this.touch.isActive = true;
                if ( !active ) {
                    active = true;
                    refresh();
                }
            }
        },
        onTouchMove : function( event ) {
            event.preventDefault();

            var touches = event.touches;

            this.touch.previousX = this.touch.X;
            this.touch.previousY = this.touch.Y;
            this.touch.X = touches[0].clientX;
            this.touch.Y = touches[0].clientY;
            this.touch.offsetX = this.touch.X - this.touch.startX;
            this.touch.offsetY = this.touch.Y - this.touch.startY;

            this.calculateLacation();

            if ( this.scaleFn) {
                this.scale.value = this.scaleFn(this.move.nowX, this.move.nowY);
            }
        },
        onTouchEnd : function( event ) {
            this.touch.offsetX = 0;
            this.touch.offsetY = 0;
            this.move.lastX = this.move.nowX;
            this.move.lastY = this.move.nowY;

            this.touch.isActive = false;
            if ( this.touchEndFn) {
                this.touchEndFn(this.move);
            }
        },
        scaleChange : function(option) {
            this.scale.isChange = true;

            this.scale.max = option.max || this.scale.max;
            this.scale.min = option.min || this.scale.min;
            this.scale.rate = option.rate || this.scale.rate;
            this.scale.callback =  option.callback || null;

            if ( !active ) {
                active = true;
                refresh();
            }

            intervalCall({
                intervalFn : function($this){
                    if ($this.scale.rate < 1 && $this.scale.value > $this.scale.min || $this.scale.rate > 1 && $this.scale.value < $this.scale.max) {
                        $this.scale.value *= $this.scale.rate;
                        return true;
                    } else {
                        $this.scale.isChange = false;
                        $this.scale.value = $this.scale.rate < 1 ? $this.scale.min : $this.scale.rate > 1 ? $this.scale.max : $this.scale.value;
                        return false;
                    }
                },
                param : this,
                callback : this.scale.callback
            });
        },
        elasticChange : function(option){

            this.elastic.direction = option.direction || this.elastic.direction;
            this.elastic.friction = option.friction || this.elastic.friction;
            this.elastic.k = option.k || this.elastic.k;
            this.elastic.callback = option.callback || this.elastic.callback;

            if ((this.elastic.direction == 'all' || this.elastic.direction == 'X') && option.X) {

                this.elastic.X.isSpringback = option.X.isSpringback || this.elastic.X.isSpringback;
                this.elastic.X.balancePosition = option.X.origin || this.elastic.X.balancePosition;
                this.elastic.X.offset = this.move.nowX - this.elastic.X.balancePosition;
                this.elastic.X.allPower = this.elastic.k * Math.pow(this.elastic.X.offset, 2);
                this.elastic.X.acceleration = - this.elastic.k * this.elastic.X.offset;
                this.elastic.X.initDirection = this.move.nowX - this.elastic.X.balancePosition > 0;
                this.elastic.X.isChange = true;

                intervalCall({
                    intervalFn : elasticing,
                    param : {
                        $this : this,
                        elasticInfo : this.elastic.X,
                        direction : 'X'
                    },
                    callback : this.elastic.callback
                });
            }
            if ((this.elastic.direction == 'all' || this.elastic.direction == 'Y') && option.Y) {

                this.elastic.Y.isSpringback = option.Y.isSpringback || this.elastic.Y.isSpringback;
                this.elastic.Y.balancePosition = option.Y.origin || this.elastic.Y.balancePosition;
                this.elastic.Y.offset = this.move.nowY - this.elastic.Y.balancePosition;
                this.elastic.Y.allPower = this.elastic.k * Math.pow(this.elastic.Y.offset, 2);
                this.elastic.Y.acceleration = - this.elastic.k * this.elastic.Y.offset;
                this.elastic.Y.initDirection = this.move.nowY - this.elastic.Y.balancePosition > 0;
                this.elastic.Y.isChange = true;

                intervalCall({
                    intervalFn : elasticing,
                    param : {
                        $this : this,
                        elasticInfo : this.elastic.Y,
                        direction : 'Y'
                    },
                    callback : this.elastic.callback
                });
            }
        },
        calculateLacation : function() {
            this.move.nowX = this.direction != 'Y' ? velidateBound(this.move.lastX + this.touch.offsetX, this.minX, this.maxX) : 0;
            this.move.nowY = this.direction != 'X' ? velidateBound(this.move.lastY + this.touch.offsetY, this.minY, this.maxY) : 0;
        },
        needUpdate : function() {
            return this.touch.isActive || this.scale.isChange || this.elastic.X.isChange || this.elastic.Y.isChange;
        },
        destroy : function() {
            this.element.removeEventListener( 'touchstart', this.touchStartDelegate, false );
            this.element.removeEventListener( 'touchmove', this.touchMoveDelegate, false );
            this.element.removeEventListener( 'touchend', this.touchEndDelegate, false );
        }
    }

    function elasticing(param) {
        var $this = param.$this;

        if ($this.touch.isActive) return false;

        var elasticInfo = param.elasticInfo;
        elasticInfo.velocity += elasticInfo.acceleration;

        var lastXoffset = elasticInfo.offset;
        elasticInfo.offset += elasticInfo.velocity;

        //到原点时不回弹，或者当前的偏移位置和运动的初始位置在原点的同一个侧
        if ( !elasticInfo.isSpringback || (elasticInfo.offset > 0) == elasticInfo.initDirection ) {

            //判断是否过原点，即判断下一个偏移位置与当前偏移位置不在原点的同一个侧
            if ( elasticInfo.offset > 0 && lastXoffset < 0 || elasticInfo.offset < 0 && lastXoffset > 0) {

                //运动方向
                var direction = elasticInfo.offset - lastXoffset > 0;
                if ( !originReset($this, elasticInfo, param.direction, direction) )
                    return false;
            } else {

                //更新新位置
                if (param.direction == 'X') {
                    $this.move.nowX += elasticInfo.velocity;
                } else if (param.direction == 'Y') {
                    $this.move.nowY += elasticInfo.velocity;
                }

            }

        } else {
            //过原点时回弹
            if ( !originReset($this, elasticInfo, param.direction, elasticInfo.initDirection) )
                return false;
        }

        if (param.direction == 'X') {
            elasticInfo.offset = $this.move.nowX - elasticInfo.balancePosition;
        } else if (param.direction == 'Y') {
            elasticInfo.offset = $this.move.nowY - elasticInfo.balancePosition;
        }

        if ( $this.scaleFn) {
            $this.scale.value = $this.scaleFn($this.move.nowX, $this.move.nowY);
        }

        elasticInfo.acceleration = - $this.elastic.k * elasticInfo.offset;

        return true;
    }

    /**
     * 过原点时校准
     * @param $this 当前对象
     * @param elasticInfo 当前弹动方向的对象
     * @param direction 当前弹动方向 {x:水平，y;垂直}
     * @param Vdirection 接下来的速度方向
     * @returns {boolean} 如果不再运动返回 false
     */
    function originReset($this, elasticInfo, direction, Vdirection) {
        elasticInfo.offset = 0;

        if (direction == 'X') {
            $this.move.nowX = elasticInfo.balancePosition;
        } else if (direction == 'Y') {
            $this.move.nowY = elasticInfo.balancePosition;
        }

        if ( Math.abs( elasticInfo.velocity ) < 0.25 && Math.abs( elasticInfo.acceleration ) < 0.25) {

            elasticInfo.velocity = 0;
            elasticInfo.acceleration = 0;
            elasticInfo.isChange = false;

            return false;
        }

        elasticInfo.allPower *= $this.elastic.friction;
        elasticInfo.velocity = Vdirection ? Math.sqrt(elasticInfo.allPower) : - Math.sqrt(elasticInfo.allPower);

        return true;
    }

    /**
     * 根据最大值最小值判断当前值的是否有效
     * @param value 当前值
     * @param min 最小值，为空则无限制
     * @param max 最大值，为空则无限制
     * @returns {number} 验证后的合法值
     */
    function velidateBound ( value, min, max ) {
        return min ? Math.max(min, max ? Math.min(max, value) : value) : max ? Math.min(max, value) : value;
    }

    /**
     * 循环调用函数，提供传参，及回调函数
     * @param optin.intervalFn 需要循环的函数，函数中return true 为继续执行循环，return false 为继续执行循环并执行回调函数
     * @param optin.param 传入optin.intervalFn的参数，optin.intervalFn 需要自己实现参数入口，可以为空
     * @param optin.interval 循环执行的间隔时间， 默认为 1000/60 ms
     * @param optin.callback 回调函数
     */
    function intervalCall( optin ) {
        var interval = optin.interval || 1000 / 60;
        setTimeout(loop, interval);

        function loop() {
            if ( optin.intervalFn(optin.param) ) {
                setTimeout(loop, interval);
            } else {
                if(typeof optin.callback == 'function'){
                    optin.callback();
                }
            }
        }
    }

    /**
     * Public API
     */
    window.FDrag = {
        init: function( target, options ) {
            if( isCapable() ) {
                return batch( target, add, options );
            }
        }
    }

    window.requestAnimFrame = (function() {
        return  window.requestAnimationFrame  ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
    })()

})();