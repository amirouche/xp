$('#main').reactiveMenu(
    '#navigation',
    {
        /* comment the following line 
           to display all headings */
        maxHeadingLevel: 3,
	
        /* add 300px when scrolling to avoid
           hiding the title */
        scrollshift: 300,

        /* 2 seconds scroll animation */
        scrollspeed: 2000,

        /* content is considered active
           if it's above that */
        activeRegion: window.innerHeight * 0.4,
    }
);
