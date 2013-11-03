(function($) {
	var myEffect=function(stage, actors, settings, theatre) {
		this.init=function() {
			actors.hide(0).first().show(0);
		}
		this.next=function() {
			actors.stop(true, true).css('z-index', 0).hide(settings.speed)
			.eq(theatre.index).css('z-index', 10).show(settings.speed);
		}
		this.prev=function() {
			actors.stop(true, true).css('z-index', 0).hide(settings.speed)
			.eq(theatre.index).css('z-index', 10).show(settings.speed);
		}
		this.destroy=function() {
			actors.stop(true, true).css({
					zIndex: '', top: '', left: '', position: '', margin: ''
				}).show(0);
		}
	}

	$.fn.theatre('effect', 'test', myEffect);
	$.fn.theatre('effect', 'test:e1', myEffect);
	$.fn.theatre('effect', 'test:e2', myEffect);		
})(jQuery)	
