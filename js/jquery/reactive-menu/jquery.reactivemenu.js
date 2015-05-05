(function($) {

    /* ** Heading id generation functions */

    /* generate a slug based on text.
       e.g. slugify("one lazy fox!") returns "one-lazy-fox" */
    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')            // Replace spaces with -
            .replace(/[^\w\-]+/g, '');       // Remove all non-word chars
    }


    /* Recursive function that generate a unique slug makes sure
       slug is unique, otherwise build a new slug by adding a
       suffix to the slug that looks like `-{some_number}`.

       - `slugs` contains the previously computed slugs.
       - `slug` the slug we want to make unique.
       - `suffix` is the next suffix number that must be tried.
    */
    function uniquify(slugs, slug, suffix) {
        var unique;

        if (suffix) {
            unique = slug + '-' + suffix;
        } else {
            unique = slug;
            suffix = 1;
        }

        if (slugs.indexOf(unique) >= 0) {
            /* new `unique` slug is not actually unique */
            /* compute another one */
            return uniquify(slug, suffix + 1);
        }

        return unique;
    }

    /* Generate a `makeId` function, with a local list of slugs
       used by uniquify.

       This is done to avoid having `slugs` a global variable,
       making the whold unique id generation machinery easily
       reusable.

       Finale function of the id generation machinery. */
    function makeIdFactory() {

        /* store previously computed slugs */
        var slugs = [];

        function makeId(text) {
            var slug = uniquify(slugs, slugify(text));
            slugs.push(slug);
            return slug;
        }

        return makeId;
    }


    /* ** Document structure caching functions */

    /* Create an object representating a heading element
       of the document.
       Every heading object is the root of a tree of headings. */
    function makeHeadingObject(makeId, element, level) {
        /* if the element already has an ``id`` attribute, use it. */
        var slug = element.attr('id');

        if (slug === undefined || slug === "") {
            /* no id, compute a unique slug
               based on the element text */
            slug = makeId(element.text());
            /* set it as the id of the element
               so that it's possible to target
               it using location.hash, making it
               possible to have shareable urls */
            element.attr("id", slug);
        }

        /* we cache a node, instead of offset in "element"
           so that we always can have the true offset at
           the time of the click. Caching offset, would
           break on window resize or font size change */
        var heading = {
            element: element,
            level: level,
            subheadings: [],
            slug: slug
        };

        return heading;
    }


    /* In order recursive insert `child` heading into `menu`
       heading, preserving the ordered hierarchical structure */
    function insort(child, menu) {
        /* child is a direct child of menu */
        if (child.level == menu.level + 1) {
            menu.subheadings.push(child);
        } else {
            /* child is not a direct child, so it's
               the child (or direct child)
               of the last child direct child of menu */
            var length = menu.subheadings.length;
            var last = menu.subheadings[length - 1];
            insort(child, last);
        }
    }

    /* build a tree datastructure reprensenting
       the document `doc`'s headings hierarchy */
    function buildHeadingHierarchy(doc, config) {
        var makeId = makeIdFactory();

        /* Root of the heading tree.

           `root` is not a true heading object
           but every heading object is a valid root */
        var root = {subheadings: []};

        /* compute selector for interesting headings */
        var headings = '';
        var i;
        for(i = 1; i <= config.maxHeadingLevel; i++) {
            headings = headings + ', h' + i;
        }
        headings = headings.slice(2);  // replace leading comma and space

        /* compute root level as min(doc heading level) - 1 */
        var rootLevel = $(headings, doc)[0].tagName[1];
        root.level = Number(rootLevel) - 1;

        $(headings, doc).each(function(index, element) {
            var tag = element.tagName;
            var level = Number(tag[1]);
            var heading = makeHeadingObject(makeId, $(element), level);

            insort(heading, root);
        });

        return root;
    }


    /* ** menu's html functions */

    /* Callback for click on a menu item */
    function menuItemClickCallback(config, event) {
        event.preventDefault();
        /* Retrieved the target `heading`, and its `offset` */
        /* `target` is a `#` character followed by the id
           of the heading it's refering to */	
        /* Take into account `scrollshift` ie. any header space
           so that the page scrolls until the heading is actually visible.
           Without a proper `scrollshift` the heading will be in the viewport
           but invisible because of elements with a bigger z-index */
        var target = $(this).attr('href');
        var offset = $(target).offset().top - config.scrollshift;
        $('html,body').animate({scrollTop: offset}, config.scrollspeed);
        history.pushState({}, '', target);
    }

    /* Build html for the given `structure` object inside `html``node */
    function buildHTML(structure, html, config) {
        var i, heading, item, link, submenu;

        for(i=0; i<structure.length; i++) {
            heading = structure[i];
            item = $('<li></li>');
            link = $('<a href="#' + heading.slug +  '">' + heading.element.text() + ' </a></li>');
            link.on('click', menuItemClickCallback.bind(link, config));
            item.append(link);
            heading.item = item;
            html.append(item);
            if(heading.subheadings.length) {
                /* build subheadings' html */
                submenu = $("<ol></ol>");
                item.append(submenu);
                buildHTML(heading.subheadings, submenu, config);
            }
        }
    }

    /* ** navigation update functions */

    /* Execute callback only once every ``milliseconds``

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
                triggered = setTimeout(timeoutCallback, milliseconds);
            }
        }

        return onTimeout;
    }

    function toggleActive(top, bottom, headings, previous) {
        $(headings).each(function(index, heading) {
            var heading_top = heading.element.offset().top;
            if(heading_top > bottom) {
                return false;
            }
            previous = heading;
            return true;
        });

        if (previous !== undefined) {
            var active = previous;
            active.item.addClass('active');
            active.item.parent().addClass('active');
            if(!toggleActive(top, bottom, active.subheadings, undefined)) {
                active.item.addClass('primary');
            }
            return true;
        }
        return false;
    }

    function registerOnScrollCallback(navigation, root, config) {
        $(window).on('scroll', makeLazyCallback(
	    config.scrollUpdateTimeout,
	    function() {
		var isNotAnimated = $('html:animated,body:animated').length === 0;
		if (isNotAnimated) {
                    var top = $(window).scrollTop();
                    var bottom = top + config.activeRegion;
                    $(".primary, .active", navigation).removeClass('primary active');
                    toggleActive(top, bottom, root.subheadings);
		}
            }));
    }

   
    function initialScroll(hash, config) {
	var target = $(hash);
 	// XXX: on webkit the .ready callback is called too soon
	// for big pages. So we need to scroll in two times
	// first time we scroll half the initial offset
	// second time we scroll to the hoppefully true offset.

	// schedule second scroll to fire just before the first
	// animation finish.
	setTimeout(
	    function secondInitialScroll() {
		var offset = target.offset().top - config.scrollshift;
		$('html,body').animate({scrollTop: offset}, config.scrollspeed / 2);
	    },
	    config.scrollspeed / 2 - 0.1
	);
		   
	// first scroll
	var offset = target.offset().top - config.scrollshift;
	$('html,body').animate({scrollTop: offset}, config.scrollspeed / 2);
    }

    var defaultConfig = {
	maxHeadingLevel: 6,
	scrollshift: 100,
	scrollspeed: 1000,
	scrollUpdateTimeout: 100,
	activeRegion: 300,
	initialScrollFunc: initialScroll
    };
    
    $.fn.reactiveMenu = function(navigation, config) {
        config = $.extend(defaultConfig, config);
	config.activeRegion = config.activeRegion + config.scrollshift;

        /* build heading hierarchical structure */
        var root = buildHeadingHierarchy(this, config);

        /* build html of the menu */
        navigation = $(navigation);
        var html = $("<ol></ol>");
        buildHTML(root.subheadings, html, config);
        navigation.append(html);

        registerOnScrollCallback(navigation, root, config);

        if(window.location.hash) {
	    config.initialScrollFunc(window.location.hash, config);
        }
    };

})(jQuery);
