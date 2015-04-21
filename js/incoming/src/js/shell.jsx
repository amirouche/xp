var React = require("react/addons");
var bogan = require('boganipsum')

var moment = require('./moment-twitter.js');
var generateThread = require('./inbox.js').generateThread;

var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;


var Header = React.createClass({
    render: function() {
        return (
            <nav>
            <div id="hamburger" className={this.props.drawerIsOpen ? "active" : ""} onClick={this.props.toggleDrawer}><span></span></div>
            <div id="brand"><h1>incoming!</h1></div> 
            <div id="search"><input /></div>
            <div id="menu"></div>
            </nav>
        )
    }
});


var Drawer = React.createClass({
    render: function() {
        return (
                <div id="drawer">
                <h1>drawer</h1>
                <ul>
                <li>item a</li>
                <li>item b</li>
                <li>item c</li>
                </ul>
            </div>
        );
    }
});


var Bundle = React.createClass({
    getInitialState: function() {
        return {
            open: false,
        }
    },

    _toggle: function() {
        this.setState({open: !this.state.open});
    },

    _render_closed : function() {
        return (
                <div className="bundle" onClick={this._toggle}>
                   <div className="header">
                        <div className="avatar"><span className="envelope" aria-hidden="true"></span></div>
                        <div className="name">Forums</div>
                        <div className="overview">
                              <span className="unread-count">13 new</span>
                              <span className="senders">hamster666, fanfan, ego10, nadouchka, mirc, sailtop, adrarr, hocine</span>
                        </div>
                        <div className="actions">
                              <span className="pin" aria-hidden="true">A</span>
                              <span className="ok" aria-hidden="true">B</span>
                              <span className="time" aria-hidden="true">C</span>
                              <span className="cog" aria-hidden="true">D</span>
		        </div>
		    </div>  
              </div>);
    },

    _render_open : function () {
	return (
                <div className="bundle open">
                    <h2 onClick={this._toggle}>Forums</h2>
                    <TimeSlice time="today" />
                    <TimeSlice time="yesterday" />
                </div>
        );
    },
    
    render: function() {
	if (this.state.open) {
	    return this._render_open();
	} else {
	    return this._render_closed();
	}
    }
});


var MailItem = React.createClass({
    render: function() {
        var subject, unread;

        if(this.props.first) {
            subject = this.props.thread.subject;    
            subject = (<span className="subject">{subject}</span>);
        } else {
            /* XXX: required to pull date to the right */
            subject = (<span className="subject" />);
        }


        var human = moment(this.props.model.date).twitterLong();
        var full = this.props.model.date.format();

        var className = this.props.model.unread ? "mail unread" : "mail";
        
        return (
                <div className={className}>
                    <div className="from" onClick={this.props._toggle}>
                        <img className="avatar" src={this.props.model.by.user.picture.thumbnail} onClick={this.props._toggle}/>
                        <span className="name">{this.props.model.by.user.username}</span>
                        {subject}
                        <span className="date" title={full}>{human}</span>
                    </div>
                <div className="body" dangerouslySetInnerHTML={{__html: this.props.model.body}}/>
                </div>
        )
    }
});



var ClosedThread = React.createClass({
    render: function() {
        var name = this.props.model.by.user.username;
        var unread = this.props.model.unread;
        if (unread > 0) {
            unread = (<span className="unread-count">{unread} new</span>);
        } else {
            unread = undefined;
        }

        return (
                <div className="header" onClick={this.props._toggle}>
                <div className="avatar"><img src={this.props.model.by.user.picture.thumbnail}/></div>
                <div className="name">{name}</div>
                <div className="overview">
                { unread }
                <span className="subject">{this.props.model.subject}</span>
                <span className="preview">{this.props.model.preview}</span>
                </div>
                <div className="actions">
                    <span className="pin" aria-hidden="true">A</span>
                    <span className="ok" aria-hidden="true">B</span>
                    <span className="time" aria-hidden="true">C</span>
                    <span className="cog" aria-hidden="true">D</span>
                </div>  
          </div>
        )
    }
})



var Thread = React.createClass({
    getInitialState: function() {
        return {
            open: false,
            expand: false,
            model: generateThread(),
        }
    },

    _toggle: function() {
        this.setState({open: !this.state.open, expand: false});
    },

    _expand: function() {
        this.setState({expand: !this.state.expand});
    },

    _render_all_mails: function() {
        var mails = this.state.model.mails.slice(1).map(function(mail, index) {
            return (<MailItem model={mail} thread={this.state.model} first={false} />)
        }.bind(this));
        var mail = this.state.model.mails[0];
        mails.splice(0, 0, ((<MailItem model={mail} thread={this.state.model} first={true} _toggle={this._toggle}/>)));
        return mails;
    },
    
    _render_open_display: function() {
        var mails, mail;
        if (this.state.model.unread > 0) {
            var collapse = this.state.model.mails.length - this.state.model.unread > 1;
            if (!collapse || this.state.expand) {
                mails = this._render_all_mails();
            } else {
                /* display first and all unread mails, separate with a separator
                   widget that can open the thread fully via this.expact */
                mails = this.state.model.mails.slice(-this.state.model.unread);
                mails = mails.map(function(mail, index) {
                    return (<MailItem model={mail} thread={this.state.model}/>);
                }.bind(this));
                var mail = this.state.model.mails[0];
                mails.splice(0, 0, (<MailItem model={mail} thread={this.state.model} first={true} _toggle={this._toggle}/>));
                mails.splice(1, 0, (<div onClick={this._expand} className="separator"></div>));
            }
        } else {
            mails = this._render_all_mails();
        }

        return (<div className="mails">{mails}</div>);
    },
    
    render: function() {
        var mails, display;
        var classes = "thread";

        if (this.state.open) {
            classes = "thread open";
            display = this._render_open_display();
        } else {
            display = (<ClosedThread model={this.state.model} _toggle={this._toggle}/>);
        }

        if (this.state.model.unread > 0) {
            classes = classes + " unread";
        }

        return (
                <div className={classes}>
                {display}
                </div>
        )
    },
})

var TimeSlice = React.createClass({
    render: function() {
        return (
                <div className="timeslice">
                    <p>{this.props.time}</p>
                    <div>
                        <Bundle/>
                        <Bundle/>
                        <Bundle/>
                        <Thread/>
                        <Thread/>               
                    </div>
                </div>
        );
    }
});



var Inbox = React.createClass({
    render: function() {
        return (
                <div id="main">
                    <div id="inbox" className="wrapper">
                        <TimeSlice time="today" />
                        <TimeSlice time="yesterday" />
                        <TimeSlice time="this week" />
                        <TimeSlice time="before" />                             
                    </div>          
                </div>
        );
    }
});


var Shell = React.createClass({
    
    getInitialState: function() {
        return {drawerIsOpen: false};
    },

    toggleDrawer: function() {
        this.setState({drawerIsOpen: !this.state.drawerIsOpen})
    },
    
    render: function() {
        var drawer;
        if (this.state.drawerIsOpen) {
            drawer = (
                    <ReactCSSTransitionGroup transitionName="drawer">
                    <Drawer key="drawer" />
                    <div id="overlay"></div>
                    </ReactCSSTransitionGroup>
            );
        } else {
            drawer = (
                    <ReactCSSTransitionGroup transitionName="drawer">
                    </ReactCSSTransitionGroup>
            );

        }
        return (
                <div id="wrapper">
                <Header drawerIsOpen={this.state.drawerIsOpen} toggleDrawer={this.toggleDrawer} />
                {drawer}
                <Inbox/>
                </div>
        )
        
    }
});



React.render(<Shell />, document.getElementsByTagName('body')[0]);
