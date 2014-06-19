(function($, _, B, window) {
	
'use strict';

var transitionEndEvent = {
		'WebkitTransition' : 'webkitTransitionEnd',
		'MozTransition'    : 'transitionend',
		'OTransition'      : 'oTransitionEnd',
		'msTransition'     : 'MSTransitionEnd',
		'transition'       : 'transitionend'
	}[Modernizr.prefixed('transition')],

	support = {
		transition : Modernizr.csstransitions
	},

	queue = (function() {

		var $win = $(window);

		return {
			add : function(name, callback, context) {
				$win.queue(name, $.proxy(callback, context || window));
			},

			next : function(name) {
				$win.dequeue(name);
			},

			clear : function(name) {
				$win.clearQueue(name);
			},

			size : function(name) {
				return $win.queue(name).length;
			}
		};

	})();

var SVG = B.View.extend({
		initialize : function() {
			this.$path = this.$('path');
			this.pathAttr = [];

			this.reset();
		},

		reset : function() {
			var pathAttr = this.pathAttr;

			this.$path.each(function(index) {
				var len = this.style.strokeDasharray = this.getTotalLength();

				pathAttr.push({
					el : this,
					len : len
				});
			});

			this.draw(0);
		},

		draw : function(val) {
			_.each(this.pathAttr, function(path, index) {
				path.el.style.strokeDashoffset = path.len * (1 - val);
			});
		}
	}),

	ProgressButton = B.View.extend({
		events : {
			'click button' : 'buttonClick'
		},

		initialize : function() {
			this.$btn = this.$('button');

			// 圆形进度条
			this.svgProgress = new SVG({
				el : this.$('svg.progress-circle')[0]
			});

			// 打钩icon
			this.svgCheckmark = new SVG({
				el : this.$('svg.checkmark')[0]
			});

			// 打叉icon
			this.svgCross = new SVG({
				el : this.$('svg.cross')[0]
			});

			this.status = {
				'loading' : {
					klass : 'loading',
					svg   : this.svgProgress,
					enter : 0,
					leave : 0
				},

				'success' : {
					klass : 'success',
					svg  : this.svgCheckmark,
					enter : 1,
					leave : 0
				},

				'error' : {
					klass : 'error',
					svg  : this.svgCross,
					enter : 1,
					leave : 0
				}
			};

			this.disabled = false;

			this.bindEvent();
			this.enable();
		},

		bindEvent : function() {
			this.$btn.hammer().on('tap', _.bind(this.buttonClick, this));
		},

		enable : function() {
			// 重新开通按钮功能
			this.$btn.prop('disabled', false);
			this.disabled = false;
		},

		disable : function() {
			// 暂时关闭按钮功能
			this.$btn.prop('disabled', true);
			this.disabled = true;
		},

		enter : function(name) {
			var status = this.status[name];

			if (status) {
				this.$el.addClass(status.klass);
				status.svg.draw(status.enter);
			}
		},

		leave : function(name) {
			var status = this.status[name];

			if (status) {
				this.$el.removeClass(status.klass);
				status.svg.draw(status.leave);
			}
		},

		submit : function() {
			// 让按钮进入loading状态
			// 等待动画播放完成
			queue.add('submit', function() {
				this.disable();
				this.enter('loading');

				if (support.transition) {
					this.$btn.one(transitionEndEvent, function() {
						queue.next('submit');
					});
				} else {
					_.delay(function() {
						queue.next('submit');
					}, ProgressButton.TRANSIT_TIME);
				}
			}, this);

			// 对外放出submit事件
			queue.add('submit', function() {
				this.trigger('submit');
			}, this);

			queue.next('submit');
		},

		complete : function(status) {
			var status = status > 0 ? 'success' : 'error';

			// 让按钮离开loading状态
			// 进入结果显示状态
			// 并让这种状态持续一段时间
			queue.add('complete', function() {
				this.leave('loading');
				this.enter(status);

				_.delay(function() {
					queue.next('complete');
				}, ProgressButton.STATUS_TIME);
			}, this);

			// 让按钮离开结果显示状态
			queue.add('complete', function() {
				this.leave(status);
				this.enable();
			}, this);
			
			// 这里是希望进度条动画能播放完整
			// 所以作了一个延迟
			_.delay(function() {
				queue.next('complete');
			}, ProgressButton.TRANSIT_TIME);
		},

		setProgress : function(val) {
			this.svgProgress.draw(val);
		},

		buttonClick : function(event) {
			event && event.preventDefault();

			if (!this.disabled) {
				this.submit();
			}
		}
	}, {
		STATUS_TIME : 1500,
		TRANSIT_TIME : 300,
	});

window.ProgressButton = ProgressButton;

})(jQuery, _, Backbone, this);