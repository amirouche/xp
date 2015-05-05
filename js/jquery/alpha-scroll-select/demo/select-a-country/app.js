console.log('oooo');
$('.alphascrollselect').alphascrollselect();

var selected;

$('.wrapper li').on('click', function(event) {
    if(selected) {
	selected.removeClass('selected');
    }
    selected = $(event.target);
    selected.addClass('selected');
});
