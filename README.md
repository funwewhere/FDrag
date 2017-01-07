# FDrag
在网页上，对元素进行拖拉时，通过简单的配置即可定制在拖拉过程中元素的动画效果。

兼容PC端和移动端。

实现动画：弹簧振子, 缩放。

具体效果请看  [demo](http://www.funwewhere.com/FDrag.html) （Ps: 移动设备测试正常，PC端拖动太快会有bug，欢迎大神修复）

### 快速使用
- **引入**

```
<script type="application/javascript" src="FDrag.js"></script>
```

- **使用**

#### #FDrag.init(el, options)  ：初始化拖动对象
- el : {string | HTMLElement}  目标元素的CSS 选择器，或 HTMLElement、jQuery 实例
- options
 -  orientation : {String, Optional} 目标元素的可拖动方向 'horizontal' : 水平,'vertical' : 垂直，'all' : 全方向。default : all
 -  maxX : {Number, Optional} 水平最大拖动位移, default: 无限制
 -  minX : {Number, Optional} 水平最小拖动位移, default: 无限制
 -  maxY : {Number, Optional} 垂直最大拖动位移, default: 无限制
 -  minY : {Number, Optional} 垂直最小拖动位移, default: 无限制
 -  scaleFn : {function, Optional} 目标元素大小随位移变化比例函数
       -  函数格式 :  输入参数 function(x : {Number,当前水平位移位置}, y : {Number,当前垂直位移位置})， 返回值  {Number, 比例值}
 - callbackTouchEnd :  {function, Optional}  目标元素拖动放开后的回调函数
      -  函数格式 :  输入参数 function(info : 当前元素的所有信息)
-  示例:
```
FDrag.init('#drag');

FDrag.init(document.querySelector('#drag'));

//创建一个对象，只能在水平方向上拖动，大小随拖动改变，拖动完成弹出提示
FDrag.init($('#drag'), {
	orientation : 'X',
	scaleFn : function(x, y){
		return (window.innerWidth+2*x)/window.innerWidth;
	},
	callbackTouchEnd : function(info){
		window.alert('当前拖动偏移量：' + info.nowX);
	}
});
```