var React = require('react')
var Dispatcher = require('flux').Dispatcher;
var keyMirror = require('keymirror');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var assign = require('object-assign');
var xhr = require("xhr");
 

window.React = React;


class QuotesStore extends EventEmitter {
    constructor(app) {
	this.quotes = [];
    }

    emitChange() {
	this.emit('change');
    }

    
    addChangeListener(callback) {
	this.on('change', callback);
    }
    
    removeChangeListener(callback) {
	this.removeListener('change', callback);
    }

    update(quotes) {
	this.quotes = quotes;
	this.emitChange();
    }

    popular() {
	return this.quotes;
    }
}


var ACTIONS = keyMirror({
    DISPLAY_POPULAR: null,
    FETCH_QUOTES: null
});


var Quote = React.createClass({
    render() {
        return (
                <div className="quote">
		<p>“{this.props.quote.text}”</p>
		<p>{this.props.quote.user.username}</p>
                </div>
        )
    }
});



var Shell = React.createClass({
   
    getInitialState: function() {
	app.publish(ACTIONS.FETCH_QUOTES);
	console.log('initial!');
	return {
	    mode: 'loading',
	    quotes: []
	}
    },

    _getState: function () {
    	return {
    	    quotes: this.props.app.stores.quotes.popular(),
	    mode: 'popular',
    	};
    },
   
    componentDidMount: function() {
	app.stores.quotes.addChangeListener(this._onChange);
    },
    
    componentWillUnmount: function() {
	app.stores.quotes.removeChangeListener(this._onChange);
    },

    _onChange: function() {
	this.setState(this._getState());
    },
        
    render: function() {
	var body;

	if(this.state.mode == 'loading') {
	    body = (<p>Please wait loading...</p>);
	} else {
	    body = this.state.quotes.map(function(quote) {
		return (<Quote key={quote.uuid} quote={quote} />);
	    })
	}
	
        return (
                <div id="wrapper">
		<h1>Quote all the things!</h1>
		{body}
                </div>
        )
    }
});


class MyDispatcher extends Dispatcher {

    publish (action, payload) {
	this.dispatch({action: action, payload: payload});
    }

    subscribe (action, callback) {
	return this.register(function(payload) {
	    if (payload.action == action) {
		callback(payload.payload);
	    }
	});
    };   
}


class App extends MyDispatcher {
    constructor() {
	super();

	var self = this;

	this.stores = {
	    quotes: new QuotesStore(this)
	}

	this.subscribe(ACTIONS.FETCH_QUOTES, function() {
	    xhr({uri: "/quotes"}, function (err, resp, body) {
		/* XXX: handle error */
		self.stores.quotes.update(JSON.parse(body));
	    });
	});
    }
}


var app = new App();
React.render(<Shell app={app}/>, document.getElementById('wrapper'));
