$('#contacts').alphascrollselect();

var selected = $('#selected');
var previous;

$('#contacts ol:first-child li').on('click', function(event) {
    var html;
    var target = event.target;
    // retrieve li element 
    if(target.tagName != 'LI') {
	target = $(target).parents('li');
    }
    if(previous) {
	previous = previous.removeClass('selected');
    }
    target.addClass('selected');
    previous = target;
    html = target.html();
    html = '<h1>Selected</h1>' + html;
    selected.html(html);
});
