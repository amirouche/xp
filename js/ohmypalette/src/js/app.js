var React = require('react');
var keyMirror = require('keymirror');
var EventEmitter = require('events').EventEmitter;
var Color = require("color");
var uuid = require('uuid');
var bogan = require('boganipsum');

var gradients = require('./gradients');


window.React = React;

// XXX: http://facebook.github.io/react/docs/working-with-the-browser.html
/* XXXX: COLOR WHEEL http://ariya.blogspot.fr/2011/02/color-wheel-on-canvas.html */
// http://flexcolorpalette.com/
// http://www.virtuosoft.eu/code/jquery-colorpickersliders/




function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function choice(list) {
    var index = random(0, list.length);
    if(list[index].length < 4) {
        return choice(list);
    } else {
        return list[index];
    }
}

function name() {
    return choice(bogan({paragraphs: 1, sentenceMin: 1, sentenceMax:1}).slice(0, -1).split(' '));
}


Color.random = function () {
    return new Color().rgb(
        random(0, 256),
        random(0, 256),
        random(0, 256)
    );
};


class Store extends EventEmitter {

    emitChange() {
        this.emit('change');
    }


    addChangeListener(callback) {
        this.on('change', callback);
    }

    removeChangeListener(callback) {
        this.removeListener('change', callback);
    }
}


function newPalette() {
    return {
        name: "New palette",
        palette: uuid(),
        colors: {},
    };
}

function newColor(color) {
    return {
        name: 'new color',
        id: uuid(),
        object: color
    };
}


class PaletteStore extends Store {

    constructor(props) {
        super(props);
        
        var color, palette;
        var identifier = 0;

        this.collection = {};

        for(var i=0; i<100; i++) {
            palette = {};
            palette.name = 'Palette #' + i;
            palette.id = i;
            palette.colors = {};
            this.collection[palette.id] = palette;

            for(var j=0; j<5;j++) {
                color = {};
                color.name = 'Color #' + identifier;
                color.id = uuid();
                color.object = Color.random();
                palette.colors[color.id] = color;
                identifier = identifier + 1;
            }
        }
    }

    update(collection) {
        this.collection = collection;
        this.emitChange();
    }

    popular() {
        return this.collection;
    }
}


class ColorSlider extends React.Component{

    _onClick(event) {
        var factor = (event.pageX - event.target.offsetLeft) / event.target.clientWidth;
        var color = this.props.currentColor();

        if(this.props.property == 'hue') {
            color.hue(360 * factor);
        } else {
            color[this.props.property](100 * factor);
        }
        this.props.currentColor(color);
    }

    render() {
        var style = gradients[this.props.property](this.props.currentColor());
        return (<div className="slider" style={style} onClick={this._onClick.bind(this)}/>);
    }
};


class CIESliders extends React.Component{

    render() {
        return (
                <div id="cie-sliders">
                <ColorSlider key="H" property="hue" currentColor={this.props.currentColor} />
                <ColorSlider key="S" property="saturation" currentColor={this.props.currentColor} />
                <ColorSlider key="L" property="lightness" currentColor={this.props.currentColor} />
                </div>
        )
    }
};


class ColorSelector extends React.Component{

    componentDidMount() {
        // XXX: generate at bootstrap time and cache
        var canvas = this.refs.wheel.getDOMNode();
        wheel = require('./wheel.js');
        wheel(canvas, 400, 400);
    }

    render() {
        return (
                <div id="editor">
                <div id="wheel"><canvas ref="wheel" width="400" height="400"></canvas></div>
                <CIESliders currentColor={this.props.currentColor}/>
                </div>
        )
    }
};


class PaletteView extends React.Component{

    _addColor() {
        var color = this.props.currentColor().clone();
        this.props.addColor(color);
    }

    render() {
        var colors = Object.keys(this.props.palette.colors).map(function(id) {
            var color = this.props.palette.colors[id];
            var style = {background: color.object.hslString()};
            return <div key={color.id} style={style} title={color.name}></div>;
        }.bind(this));

        var style = {
            background: this.props.currentColor().hslaString()
        }

        return (
                <div id="palette-view">
                <div id="current-color" style={style}></div>
                <p onClick={this._addColor.bind(this)}>add current color to palette</p>
                <div id="colors">{colors}</div>
                </div>
        )
    }
};


class PaletteEditor extends React.Component{

    constructor(props) {
        super(props);
        var currentColor;
        var key = Object.keys(this.props.palette.colors)[0];
        if(key) {
            var currentColor = this.props.palette.colors[key].object.clone();
        } else {
            /* replace with random color */
            currentColor = Color("hsl(171, 69%, 50%)");
        }
        this.state = {
            currentColor: currentColor,
            palette: this.props.palette,
        };

        this._currentColor = this._currentColor.bind(this);
    }

    _currentColor(color) {
        if(color) {
            this.setState({currentColor: color});
        } else {
            return this.state.currentColor;
        }
    }

    _addColor(color) {
        color = newColor(color);
        this.state.palette.colors[color.id] = color;
        this.setState({palette: this.state.palette});
    }

    render() {
        var body;
        return (
                <div id="palette-editor">
                <h1 className="title">editor</h1>
                <div className="wrapper">
                <ColorSelector currentColor={this._currentColor} />
                <PaletteView currentColor={this._currentColor} palette={this.props.palette} addColor={this._addColor.bind(this)} />
                </div>
                </div>
        )
    }
};

/* **************** HOME */

class SmallPalette extends React.Component{

    _onClick() {
        this.props.onEdit(this.props.palette);
    }
    
    render() {
        var body = Object.keys(this.props.palette.colors).map(function(id) {
            var color = this.props.palette.colors[id];
            var style = {background: color.object.hslString()};
            return <div key={color.id} style={style} title={color.name}></div>;
        }.bind(this));

        return (
                <div className="palette" onClick={this._onClick.bind(this)}>
                    <div className="colors">{body}</div>
                    <div className="metadata">{this.props.palette.name}</div>
                </div>
        );
    }
};



class Home extends React.Component{

    constructor(props) {
        super(props);

        this.state = {
            palettes: app.stores.palettes.popular(),
            colors: {}
        };
    }

    // componentDidMount() {
    //     app.stores.palettes.addChangeListener(this._onChange);
    // }

    // componentWillUnmount() {
    //     app.stores.palettes.removeChangeListener(this._onChange);
    // }

    // _onChange() {
    //     this.setState(this._getState());
    // }

    render() {
        var body;

        if(this.state.palettes.length == 0) {
            body = (<p>Nothing yet...</p>);
        } else {
            body = Object.keys(this.state.palettes).map(function(id) {
                var palette = this.state.palettes[id];
                return <SmallPalette
                          onEdit={this.props.onEdit}
                          key={palette.id}
                          palette={palette} />;
            }.bind(this))
        }

        return (
                <div className="home">
                <h1 className="title">home <span onClick={this.props.onNew}>[start a new]</span></h1>
                {body}
                </div>
        )
    }
};


class Shell extends React.Component{

    constructor(props) {
        super(props);
        this.state = {mode: 'home'};
    }

    _onEdit (palette) {
        this.setState({palette: palette, mode: 'edit'});
    }

    _onNew () {
        this.setState({palette: newPalette(), mode: 'edit'});
    }

    _goToHome () {
        this.setState({mode: 'home'});
    }
    
    render() {
        var body;
        console.log
        if (this.state.mode == 'edit') {
            body = <PaletteEditor palette={this.state.palette}/>;
        } else {
            body = <Home onNew={this._onNew.bind(this)} onEdit={this._onEdit.bind(this)} />;
        }

        return (
                <div className="wrapper">
                <div id="header">
                <div onClick={this._goToHome.bind(this)}>oh my palette</div>
                <div><span className="search"></span><input type="text" /></div>
                </div>
                <div id="main">
                {body}
                </div>
                </div>
               );
    }
};


class App {
    constructor() {
        this.stores = {
            palettes: new PaletteStore()
        }
    }
}


var app = new App();

React.render(<Shell />, document.getElementsByTagName('body')[0]);
