(function(){

    "use strict";

    // When a list is configured as 'live', this is how frequently
    // the DOM will be polled for changes
    var LIVE_INTERVAL = 500;

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
                    lists[i].element.style.webkitTransform = 'translate('+ lists[i].move.nowX +'px, ' + lists[i].move.nowY + 'px) scale(' + lists[i].scale.value + ', ' + lists[i].scale.value + ')';
                }
            }
        }
    }

    function add( element, options ) {
        // Delete duplicates (but continue and re-bind this list to get the
        // latest properties and list items)
        if( contains( element ) ) {
            remove( element );
        }

        var dragObject = IS_TOUCH_DEVICE ? new DragObject( element, options) : null;

        dragObject.bind();
        // Add this element to the collection
        lists.push( dragObject );

        return dragObject;
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
            velocity : 0,
            lastX : 0,
            lastY : 0,
        }

        this.scale = {
            isChange : false,
            value : 1,
            max : 1,
            min : 0.03,
            rate : 0.78,
            callback : null
        }

        this.elastic = {
            isChange : false,
            initPosition : 0,
            acceleration : 0,
            friction : 1,
            k : 0.01,
            offset : 0,
            all : 0,
            callback : null
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

    }

    DragObject.prototype = {
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
            this.elastic.isChange = true;

            this.elastic.initPosition = option.initPositiont || this.elastic.initPosition;
            this.elastic.offset = this.move.nowX - this.elastic.initPosition;
            this.elastic.all = this.elastic.k * Math.pow(this.elastic.offset, 2);
            this.elastic.acceleration = - this.elastic.k * this.elastic.offset;
            this.elastic.callback = null;

            intervalCall({
                intervalFn : function($this) {
                    if($this.move.velocity != 0 || $this.elastic.acceleration != 0) {

                        $this.move.velocity += $this.elastic.acceleration;
                        $this.elastic.offset += $this.move.velocity;
                        $this.elastic.offset = $this.move.nowX - $this.elastic.initPosition;

                        if($this.elastic.offset < 0) {
                            $this.elastic.offset =0;
                            $this.move.nowX = 0;
                            $this.elastic.all *= $this.elastic.friction;
                            $this.move.velocity = Math.sqrt($this.elastic.all);
                        } else {
                            $this.move.nowX += $this.move.velocity;
                        }

                        $this.elastic.offset = $this.move.nowX - $this.elastic.initPosition;

                        if ( $this.scaleFn) {
                            $this.scale.value = $this.scaleFn($this.move.nowX, $this.move.nowY);
                        }

                        $this.elastic.acceleration = - $this.elastic.k * $this.elastic.offset;

                        if ( Math.abs($this.move.velocity ) < 0.5) {
                            $this.move.velocity = 0;
                        }
                        if ( Math.abs($this.elastic.acceleration ) < 0.5) {
                            $this.elastic.acceleration = 0;
                        }

                        return true;
                    }
                    $this.elastic.isChange = false;
                    return false;
                },
                param : this,
                callback : this.elastic.callback
            });
        },
        calculateLacation : function() {
            this.move.nowX = this.direction != 'Y' ? velidateBound(this.move.lastX + this.touch.offsetX, this.minX, this.maxX) : 0;
            this.move.nowY = this.direction != 'X' ? velidateBound(this.move.lastY + this.touch.offsetY, this.minY, this.maxY) : 0;
        },
        needUpdate : function() {
            return this.touch.isActive || this.scale.isChange || this.elastic.isChange;
        },
        destroy : function() {
            List.prototype.destroy.apply( this );

            this.element.removeEventListener( 'touchstart', this.touchStartDelegate, false );
            this.element.removeEventListener( 'touchmove', this.touchMoveDelegate, false );
            this.element.removeEventListener( 'touchend', this.touchEndDelegate, false );
        }
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
