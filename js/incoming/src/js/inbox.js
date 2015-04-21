var moment = require('moment');
var bogan = require('boganipsum');
var uuid = require('uuid');

var users = require('./users.js')


function subject() {
    return bogan({paragraphs: 1, sentenceMin: 1, sentenceMax:1}).slice(0, -1);
}

function preview() {
    return subject();
}

function body() {
    return '<p>' + bogan({paragraphs: 1 }) + '</p>';
}

function quote() {
    return '<p class="quote">' + bogan({ paragraphs: 1, sentenceMin: 1, sentenceMax: 5 }) + '</p>';
}


/* random related functions */

function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


function sample(list, number) {
    var output = [];
    var length = list.length;
    var i, index;
    for (i=0; i<number; i++) {
	index = random(0, length);
	output.push(list[index]);
    }
    return output;
}

function choice(list) {
    var index = random(0, list.length);
    return list[index];
}

/* random thread generation */

function generateThread() {
    var thread = {uuid: uuid()};
    var mails = [];
    thread.mails = mails;
    thread.subject = subject();
    thread.unread = 0;
    // XXX: should be based on the first unread email
    thread.preview = preview();
    var groupSize = groupSize = random(1, 10);
    var group = sample(users, groupSize);
    thread.to = group;

    var length = random(1, 10);
    
    var i, mail, delta;
    var unread = true;
    var date = moment();

    for(i=0; i<length; i++) {
	delta = random(0, 100000);
	date = date.clone();
	date.subtract(delta, 'seconds');

	mail = {
	    id: uuid(),
	    by: choice(group),
	    body: body(),
	    date: date,
	}

	/* with quote ? */
	if (random(0, 2) == 1) {
	    mail.body = quote() + mail.body;
	}

	
	if (unread) {
	    if (random(0, 2) == 1) {
		unread = false;
		previous = thread.mails[mails.length - 1];
		if(previous) {
		    thread.date = previous.date;
		    thread.by = previous.by;
		} else {
		    thread.date = mail.date;
		    thread.by = mail.by;
		}
	    } else {
		thread.unread += 1;
	    }
	}

	mail.unread = unread;

	thread.mails.push(mail);
    }

    thread.mails.reverse();

    if(!thread.by) {
	thread.by = thread.mails[0].by;
	thread.date = thread.mails[0].date;
    }
    
    return thread;
}


module.exports = {
    generateThread: generateThread,
}
