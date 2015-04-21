var express = require('express')

var bogan = require('boganipsum');
var uuid = require('uuid');

var users = require('./users.js')


function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function choice(list) {
    var index = random(0, list.length);
    return list[index];
}

function generateQuote() {
    return {
	user: choice(users).user,
	uuid: uuid(),
	text: bogan({paragraphs: 1, sentenceMin: 1, sentenceMax:1}).slice(0, -1)
    };

}



var app = express()

app.use('/dist', express.static(__dirname +  '/dist'));


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
})


app.get('/quotes', function(req, res) {
    var quotes = [];
    for(i=0; i<20; i++) {
	quotes.push(generateQuote());
    }
    res.send(quotes);
})


var server = app.listen(3001, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

})
