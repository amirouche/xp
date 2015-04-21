var React = require('react');


var GENRES = {
    "Christian Rap": 61,
    "Instrumental": 33,
    "Metal": 9,
    "Space": 44,
    "Acid Punk": 73,
    "Trance": 31,
    "Psychadelic": 67,
    "Sound Clip": 37,
    "Polka": 75,
    "Showtunes": 69,
    "Other": 12,
    "Ska": 21,
    "Retro": 76,
    "Meditative": 45,
    "Trailer": 70,
    "Gangsta": 59,
    "Pranks": 23,
    "Instrumental Rock": 47,
    "Instrumental Pop": 46,
    "Trip-Hop": 27,
    "Grunge": 6,
    "Bass": 41,
    "Oldies": 11,
    "Hip-Hop": 7,
    "Southern Rock": 56,
    "Jazz": 8,
    "Death Metal": 22,
    "Fusion": 30,
    "Musical": 77,
    "Soundtrack": 24,
    "R&B": 14,
    "Game": 36,
    "Techno": 18,
    "Blues": 0,
    "Ethnic": 48,
    "Cult": 58,
    "Euro-Techno": 25,
    "Lo-Fi": 71,
    "Funk": 5,
    "Rock & Roll": 78,
    "Cabaret": 65,
    "Reggae": 16,
    "Pop-Folk": 53,
    "Country": 2,
    "Tribal": 72,
    "AlternRock": 40,
    "Punk": 43,
    "Soul": 42,
    "Vocal": 28,
    "Disco": 4,
    "New Wave": 66,
    "Noise": 39,
    "Jungle": 63,
    "Rock": 17,
    "Gospel": 38,
    "Hard Rock": 79,
    "Dream": 55,
    "Jazz+Funk": 29,
    "Native American": 64,
    "Classic Rock": 1,
    "Comedy": 57,
    "Techno-Industrial": 51,
    "Industrial": 19,
    "Acid Jazz": 74,
    "Classical": 32,
    "Eurodance": 54,
    "Dance": 3,
    "House": 35,
    "Pop/Funk": 62,
    "Pop": 13,
    "Darkwave": 50,
    "New Age": 10,
    "Gothic": 49,
    "Rap": 15,
    "Ambient": 26,
    "Rave": 68,
    "Top 40": 60,
    "Alternative": 20,
    "Acid": 34,
    "Electronic": 52
}


var GenreView = React.createClass({
    onSelectGenre: function() {
	this.props.selectGenre(this.props.name, this.props.genreid)
    },
    render: function() {
	return (
	    <div onClick={this.onSelectGenre}>
	    { this.props.name }
	    </div>
	);
    }
});

var GenresView = React.createClass({
    render: function(){
	var view = this;
	var genres = Object.keys(this.props.genres);
	genres.sort();
	var genresNodes = genres.map(function (genre) {
	    var genreid = view.props.genres[genre];
	    return (
		<GenreView selectGenre={view.props.selectGenre} key={genreid} name={genre} genreid={genreid} />
	    );
	});
	
	if (this.props.mode == 'genres') {
	    return (
		<div id="genres">
		{genresNodes}
		</div>
	    );
	} else {
	    return (
		<div className="hidden" id="genres">
		{genresNodes}
		</div>
	    );
	}
    }
});


var AlbumView = React.createClass({
    onSelectAlbum: function() {
	this.props.selectAlbum(this.props.id);
    },
    render: function() {
	return (
	    <div onClick={this.onSelectAlbum}>
	    <img src={this.props.cover} />
	    <div>
	    <p>{this.props.name}</p>
	    <p>{this.props.artist}</p>
	    <p>{this.props.release}</p>
	    </div>
	    </div>
	);
    }
});


var AlbumsView = React.createClass({
    render: function(){
	var view = this;
	var children = this.props.albums.map(function (album) {
	    return (
		<AlbumView key={album.id} release={album.release} cover={album.cover} name={album.name} artist={album.artist} id={album.id} selectAlbum={view.props.selectAlbum}/>
	    );
	});

	if(this.props.mode == 'albums') {
	    return (
		<div id="albums">
		<h1><span onClick={this.props.back}>«</span> {this.props.genre}</h1>
		{children}
		</div>
	    );
	} else {
	    return (
		<div className="hidden" id="albums">
		<h1>{this.props.genre}</h1>
		{children}
		</div>
	    );
	}
    }
});


var AlbumView = React.createClass({
    onSelectAlbum: function() {
	this.props.selectAlbum(this.props.id);
    },
    render: function() {
	return (
	    <div onClick={this.onSelectAlbum}>
	    <img src={this.props.cover} />
	    <div>
	    <p>{this.props.name}</p>
	    <p>{this.props.artist}</p>
	    <p>{this.props.release}</p>
	    </div>
	    </div>
	);
    }
});


var TrackView = React.createClass({
    onSelectTrack: function() {
	this.props.playTrack(this.props.position);
    },
    render: function(){
	if (this.props.played == this.props.position) {
	    return (<p className="played">{this.props.name}</p>);
	} else {
	    return (<p onClick={this.onSelectTrack}>{this.props.name}</p>);
	}
    }
});

var Player = React.createClass({
    render: function(){
	var view = this;
	if(this.props.mode == 'player') {
	    var children = this.props.album.tracks.map(function(track) {
		return (<TrackView key={track.position} played={view.props.played} playTrack={view.props.playTrack} position={track.position} played={view.props.played} name={track.name} mp3={track.mp3} />);
	    });
	    return (
		<div id="player">
		<h1><span onClick={this.props.back}>«</span> {this.props.album.name} <small>by</small> {this.props.album.artist}</h1>
		<img src={this.props.album.cover} />
		<div>{children}</div>
		</div>
	    );
	} else {
	    return (
		<div className="hidden" id="player">
		</div>
	    );
	}
    }
});


var SleekJam = React.createClass({

    getInitialState: function() {
	var player = $('audio')[0];
	return {albums: [], genre: null, mode: "genres", album: {}, played: null, player: player};
    },

    selectGenre: function(name, genreid) {
	$.ajax({
	    url: 'genres/' + genreid + '.json',
	    dataType: 'json',
	    success: function(data) {
		$("html").scrollTop(0);
		this.setState({
		    albums: data['albums'],
		    genre: name,
		    mode: 'albums',
		});
	    }.bind(this),
	    error: function(xhr, status, err) {
		console.error(status, err.toString());
	    }.bind(this)
	});
    },

    selectAlbum: function(id) {
	$.ajax({
	    url: 'albums/' + id + '.json',
	    dataType: 'json',
	    success: function(data) {
		$("html").scrollTop(0);
		this.setState({
		    album: data,
		    mode: 'player',
		});
		this.playTrack(1);
	    }.bind(this),
	    error: function(xhr, status, err) {
		console.error(status, err.toString());
	    }.bind(this)
	});
    },

    playTrack: function(position) {
	var track = this.state.album.tracks[position - 1];
	this.state.player.src = track.mp3;
	this.state.player.play();
	this.setState({played: position});
    },

    stopPlayer: function() {
	this.state.player.pause();
	this.state.player.src = '';
	this.state.player.removeAttribute('src');
    },
    
    back: function() {
	if (this.state.mode == 'player') {
	    this.stopPlayer();
	    this.setState({
		album: null,
		mode: 'albums',
	    });
	} else {
	    if(this.state.mode == 'albums') {
		this.setState({
		    albums: [],
		    genre: null,
		    mode: 'genres',
		});
	    }
	}
	
    },
    
    render: function(){
	var genres = <GenresView mode={this.state.mode} genres={GENRES} selectGenre={this.selectGenre} />;
	var albums = <AlbumsView back={this.back} mode={this.state.mode} albums={this.state.albums} genre={this.state.genre} selectAlbum={this.selectAlbum}/>;
	var player = <Player back={this.back} mode={this.state.mode} album={this.state.album} playTrack={this.playTrack} played={this.state.played}/>;
	return (<div className="foo">{genres}{albums}{player}</div>)  ;
    }
});


React.render(<SleekJam />, document.getElementById('main'));

