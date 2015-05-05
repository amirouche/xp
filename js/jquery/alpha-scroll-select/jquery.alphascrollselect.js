(function($) {
  
    /* Execute ``callback`` only once every ``milliseconds``

       Save a few cpu cycles */
    function makeLazyCallback(milliseconds, callback) {
        var triggered = null;

        function animeCallback() {
            callback();
            triggered = null;
        }

        function timeoutCallback() {
            requestAnimationFrame(animeCallback);
        }
        
        function onTimeout() {
            if(triggered === null) {
                setTimeout(timeoutCallback, milliseconds);
            }
        }

        return onTimeout;
    }
  
    /* make visible letters active */
    function toggleActive(wrapper) {
        var top, bottom;
        var letters = $('.first-letter', wrapper);

        top = wrapper.position().top;
        bottom = top + wrapper.height();

	var last = $(letters[0]);
	var first = true;
        letters.each(function(index, elt) {
            var element = $(elt);
            var element_top = element.offset().top;

            if ((element_top >= top) && (element_top < bottom)) {
                element.data('item').addClass('in-view');

                var prev = element.prev();
                if(prev.length == 1) {
                    var previous = $(prev);
                    var previous_top = $(prev).offset().top;
                    if ((previous_top >= top) && (previous_top < bottom)) {
                        var previousFirstLetter = element.prevAll('.first-letter')[0];
                        $(previousFirstLetter).data('item').addClass('in-view');
                    }
                }
		last = element;
                return true;
            }

	    if ((element_top > bottom) && first === true) {
		last.data('item').addClass('in-view');
		first = false;
	    }
	    last = element;
            element.data('item').removeClass('in-view');                
        });
    }

    function onClickLetter(wrapper, scrollspeed, event) {
        event.preventDefault();
        var character = this;
        var element = $('.first-' + character, wrapper);
        if (element.length > 0) {
            var offset = element.position().top;
            offset = wrapper.scrollTop() + offset - wrapper.offset().top;
            wrapper.animate(
		{scrollTop: offset},
		scrollspeed,
		toggleActive.bind(undefined, wrapper)
	    );
        }
        return false;
    }

    var defaultConfig = {
	scrollspeed: 1000,
	scrollUpdateTimeout: 100,
	abc: 'abcdefghijklmnopqrstuvwxyz',
    };
    
    $.fn.alphascrollselect = function(config) {
        /* setup configuration */

	config = $.extend(defaultConfig, config);
        
        var container = this;
        var wrapper = $('.wrapper', this);
        
        var scrollbar = $('<ol class="scrollbar"></ol>');
	var items = {};
        var item;

        // add item for elements starting with a number
        item = $('<li class="letter-num">#</li>');
        item.on('click', onClickLetter.bind('num', wrapper, config.scrollspeed));
        scrollbar.append(item);
	items.num = item;

        var abc = config.abc.split('');
        abc.map(function(character) {
            item = $('<li class="letter-' + character + '">' + character + '</li>');
            item.on('click', onClickLetter.bind(character, wrapper, config.scrollspeed));
            scrollbar.append(item);
	    items[character] = item;
        });

        var previous;
        $('.wrapper li', container).each(function(index, elt) {
            var element = $(elt);

            var character = element.data('key');
	    if (!character) {
		character = element.text();
	    }

	    character = character[0].toLowerCase();

            if (Number(character) || abc.indexOf(character) == -1) {
                if (previous != 'num') {
                    element.addClass('first-letter');
                    element.addClass('first-num');
		    element.data('item', items.num);
                    previous = 'num';
                }
            } else {
                if (previous != character) {
                    element.addClass('first-letter');
                    element.addClass('first-' + character);
		    element.data('item', items[character]);
                    previous = character;
                }
            }
        });

        container.append(scrollbar);
       
        wrapper.on('scroll', makeLazyCallback(
            config.scrollUpdateTimeout,
            toggleActive.bind(undefined, wrapper)
        ));

	// set initial in view letters 
	toggleActive(wrapper);
    };
})(jQuery);
