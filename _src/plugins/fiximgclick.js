///import core
///commands 修复chrome下图片不能点击的问题，出现八个角可改变大小
///commandsName  FixImgClick
///commandsTitle  修复chrome下图片不能点击的问题，出现八个角可改变大小
//修复chrome下图片不能点击的问题，出现八个角可改变大小

UE.plugins['fiximgclick'] = (function () {

    function Scale() {
        this.editor = null;
        this.resizer = null;
        this.cover = null;
        this.doc = document;
        this.prePos = {x: 0, y: 0};
        this.startPos = {x: 0, y: 0};
    }

    (function () {
        var rect = [
            //[left, top, width, height]
            [0, 0, -1, -1],
            [0, 0, 0, -1],
            [0, 0, 1, -1],
            [0, 0, -1, 0],
            [0, 0, 1, 0],
            [0, 0, -1, 1],
            [0, 0, 0, 1],
            [0, 0, 1, 1]
        ];

        Scale.prototype = {
            init: function (editor) {
                var me = this;
                me.editor = editor;
                me.startPos = this.prePos = {x: 0, y: 0};
                me.dragId = -1;

                var hands = [],
                    cover = me.cover = document.createElement('div'),
                    resizer = me.resizer = document.createElement('div');

                cover.id = me.editor.ui.id + '_imagescale_cover';
                cover.style.cssText = 'position:absolute;display:none;z-index:' + (me.editor.options.zIndex) + ';filter:alpha(opacity=0); opacity:0;background:#CCC;';
                domUtils.on(cover, 'mousedown click', function () {
                    me.hide();
                });

                for (i = 0; i < 8; i++) {
                    hands.push('<span class="edui-editor-scale-hand' + i + '"></span>');
                }
                resizer.id = me.editor.ui.id + '_imagescale';
                resizer.className = 'edui-editor-scale';
                resizer.innerHTML = hands.join('');
                resizer.style.cssText += ';display:none;border:1px solid #3b77ff;z-index:' + (me.editor.options.zIndex) + ';';

                me.editor.ui.getDom().appendChild(cover);
                me.editor.ui.getDom().appendChild(resizer);

                me.initStyle();
                me.initEvents();
            },
            initStyle: function () {
                utils.cssRule('imagescale', '.edui-editor-scale{position:absolute;border:1px solid #38B2CE;}' +
                    '.edui-editor-scale span{position:absolute;width:6px;height:6px;overflow:hidden;font-size:0px;display:block;background-color:#3C9DD0;}'
                    + '.edui-editor-scale .edui-editor-scale-hand0{cursor:nw-resize;top:0;margin-top:-4px;left:0;margin-left:-4px;}'
                    + '.edui-editor-scale .edui-editor-scale-hand1{cursor:n-resize;top:0;margin-top:-4px;left:50%;margin-left:-4px;}'
                    + '.edui-editor-scale .edui-editor-scale-hand2{cursor:ne-resize;top:0;margin-top:-4px;left:100%;margin-left:-3px;}'
                    + '.edui-editor-scale .edui-editor-scale-hand3{cursor:w-resize;top:50%;margin-top:-4px;left:0;margin-left:-4px;}'
                    + '.edui-editor-scale .edui-editor-scale-hand4{cursor:e-resize;top:50%;margin-top:-4px;left:100%;margin-left:-3px;}'
                    + '.edui-editor-scale .edui-editor-scale-hand5{cursor:sw-resize;top:100%;margin-top:-3px;left:0;margin-left:-4px;}'
                    + '.edui-editor-scale .edui-editor-scale-hand6{cursor:s-resize;top:100%;margin-top:-3px;left:50%;margin-left:-4px;}'
                    + '.edui-editor-scale .edui-editor-scale-hand7{cursor:se-resize;top:100%;margin-top:-3px;left:100%;margin-left:-3px;}');
            },
            initEvents: function () {
                var me = this;

                me.startPos.x = me.startPos.y = 0;
                me.isDraging = false;
            },
            _eventHandler: function (e) {
                var me = this;
                switch (e.type) {
                    case 'mousedown':
                        var hand = e.target || e.srcElement, hand;
                        if (hand.className.indexOf('edui-editor-scale-hand') != -1 && me.dragId == -1) {
                            me.dragId = hand.className.slice(-1);
                            me.startPos.x = me.prePos.x = e.clientX;
                            me.startPos.y = me.prePos.y = e.clientY;
                            domUtils.on(me.doc,'mousemove', me.proxy(me._eventHandler, me));
                        }
                        break;
                    case 'mousemove':
                        if (me.dragId != -1) {
                            me.updateContainerStyle(me.dragId, {x: e.clientX - me.prePos.x, y: e.clientY - me.prePos.y});
                            me.prePos.x = e.clientX;
                            me.prePos.y = e.clientY;
                            me.updateTargetElement();
                        }
                        break;
                    case 'mouseup':
                        if (me.dragId != -1) {
                            me.updateContainerStyle(me.dragId, {x: e.clientX - me.prePos.x, y: e.clientY - me.prePos.y});
                            me.updateTargetElement();
                            if (me.target.parentNode) me.attachTo(me.target);
                            me.dragId = -1;
                        }
                        domUtils.un(me.doc,'mousemove', me.proxy(me._eventHandler, me));
                        break;
                    default:
                        break;
                }
            },
            updateTargetElement: function () {
                var me = this,
                    targetPos;
                domUtils.setStyles(me.target, {
                    'width': me.resizer.style.width,
                    'height': me.resizer.style.height
                })
                me.attachTo(me.target);
            },
            updateContainerStyle: function (dir, offset) {
                var me = this,
                    dom = me.resizer, tmp;

                if (rect[dir][0] != 0) {
                    tmp = parseInt(dom.style.left) + offset.x;
                    dom.style.left = me._validScaledProp('left', tmp) + 'px';
                }
                if (rect[dir][1] != 0) {
                    tmp = parseInt(dom.style.top) + offset.y;
                    dom.style.top = me._validScaledProp('top', tmp) + 'px';
                }
                if (rect[dir][2] != 0) {
                    tmp = dom.clientWidth + rect[dir][2] * offset.x;
                    dom.style.width = me._validScaledProp('width', tmp) + 'px';
                }
                if (rect[dir][3] != 0) {
                    tmp = dom.clientHeight + rect[dir][3] * offset.y;
                    dom.style.height = me._validScaledProp('height', tmp) + 'px';
                }
            },
            _validScaledProp: function (prop, value) {
                var ele = this.resizer,
                    wrap = document;

                value = isNaN(value) ? 0 : value;
                switch (prop) {
                    case 'left':
                        return value < 0 ? 0 : (value + ele.clientWidth) > wrap.clientWidth ? wrap.clientWidth - ele.clientWidth : value;
                    case 'top':
                        return value < 0 ? 0 : (value + ele.clientHeight) > wrap.clientHeight ? wrap.clientHeight - ele.clientHeight : value;
                    case 'width':
                        return value <= 0 ? 1 : (value + ele.offsetLeft) > wrap.clientWidth ? wrap.clientWidth - ele.offsetLeft : value;
                    case 'height':
                        return value <= 0 ? 1 : (value + ele.offsetTop) > wrap.clientHeight ? wrap.clientHeight - ele.offsetTop : value;
                }
            },
            hideCover: function () {
                this.cover.style.display = 'none';
            },
            showCover: function () {
                var me = this,
                    editorPos = domUtils.getXY(me.editor.ui.getDom()),
                    iframePos = domUtils.getXY(me.editor.iframe);

                domUtils.setStyles(me.cover, {
                    'width': me.editor.iframe.offsetWidth + 'px',
                    'height': me.editor.iframe.offsetHeight + 'px',
                    'top': iframePos.y - editorPos.y + 'px',
                    'left': iframePos.x - editorPos.x + 'px',
                    'position': 'absolute',
                    'display': ''
                })
            },
            show: function (targetObj) {
                var me = this;
                me.resizer.style.display = 'block';
                if(targetObj) me.attachTo(targetObj);

                domUtils.on(this.resizer, 'mousedown', me.proxy(me._eventHandler, me));
                domUtils.on(me.doc, 'mouseup', me.proxy(me._eventHandler, me));

                me.showCover();
                me.editor.fireEvent('afterscaleshow', me);
                me.editor.fireEvent('saveScene');
            },
            hide: function () {
                var me = this;
                me.hideCover();
                me.resizer.style.display = 'none';

                domUtils.un(me.resizer, 'mousedown', me.proxy(me._eventHandler, me));
                domUtils.un(me.doc, 'mouseup', me.proxy(me._eventHandler, me));
                me.editor.fireEvent('afterscalehide', me);
            },
            proxy: function( fn, context ) {
                return function(e) {
                    return fn.apply( context || this, arguments);
                };
            },
            attachTo: function (targetObj) {
                var me = this,
                    target = me.target = targetObj,
                    resizer = this.resizer,
                    imgPos = domUtils.getXY(target),
                    iframePos = domUtils.getXY(me.editor.iframe),
                    editorPos = domUtils.getXY(resizer.parentNode);

                domUtils.setStyles(resizer, {
                    'width': target.width + 'px',
                    'height': target.height + 'px',
                    'left': iframePos.x + imgPos.x - me.editor.document.body.scrollLeft - editorPos.x - parseInt(resizer.style.borderLeftWidth) + 'px',
                    'top': iframePos.y + imgPos.y - me.editor.document.body.scrollTop - editorPos.y - parseInt(resizer.style.borderTopWidth) + 'px'
                });
            }
        }
    })();

    return function () {
        var me = this,
            imageScale;

        if (browser.webkit) {
            me.addListener('click', function (type, e) {
                var range = me.selection.getRange(),
                    img = range.getClosedNode();

                if (img && img.tagName == 'IMG') {
                    if (!imageScale) {
                        imageScale = new Scale();
                        imageScale.init(me);
                        me.ui.getDom().appendChild(imageScale.resizer);

                        var _keyDownHandler = function (e) {
                            imageScale.hide();
                        }, _mouseDownHandler = function (e) {
                            var ele = e.target || e.srcElement;
                            if (ele && (ele.className===undefined || ele.className.indexOf('edui-editor-scale') == -1)) {
                                _keyDownHandler(e);
                            }
                        }, timer;

                        me.addListener('afterscaleshow', function (e) {
                            domUtils.on(document, 'keydown', _keyDownHandler);
                            domUtils.on(me.document,'keydown', _keyDownHandler);
                            domUtils.on(document,'mousedown', _mouseDownHandler);
                            domUtils.on(me.document,'mousedown', _mouseDownHandler);
                            me.selection.getNative().removeAllRanges();
                        });
                        me.addListener('afterscalehide', function (e) {
                            domUtils.un(document, 'keydown', _keyDownHandler);
                            domUtils.un(me.document,'keydown', _keyDownHandler);
                            domUtils.un(document,'mousedown', _mouseDownHandler);
                            domUtils.un(me.document,'mousedown', _mouseDownHandler);
                            var target = imageScale.target;
                            if (target.parentNode) {
                                me.selection.getRange().selectNode(target).select();
                            }
                        });
                        //TODO 有iframe的情况，mousedown不能往下传。。
                        domUtils.on(imageScale.resizer, 'mousedown', function (e) {
                            me.selection.getNative().removeAllRanges();
                            var ele = e.target || e.srcElement;
                            if (ele && ele.className.indexOf('edui-editor-scale-hand') == -1) {
                                timer = setTimeout(function () {
                                    imageScale.hide();
                                }, 200);
                            }
                        });
                        domUtils.on(imageScale.resizer, 'mouseup', function (e) {
                            var ele = e.target || e.srcElement;
                            if (ele && ele.className.indexOf('edui-editor-scale-hand') == -1) {
                                clearTimeout(timer);
                            }
                        });
                    }
                    imageScale.show(img);
                } else {
                    if (imageScale && imageScale.resizer.style.display != 'none') imageScale.hide();
                }
            });
            me.addListener('click', function (type, e) {
                if (e.target.tagName == 'IMG') {
                    var range = new dom.Range(me.document);
                    range.selectNode(e.target).select();
                }
            });
        }
    }
})();