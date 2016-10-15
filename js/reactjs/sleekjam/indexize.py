import os
from lxml.etree import parse
from json import dump as jsondump

def dump(obj, fp):
    jsondump(obj, fp, indent=4)


# wget http://imgjam.com/data/dbdump_artistalbumtrack.xml.gz
# gzip -d dbdump_artistalbumtrack.xml.gz
xml = parse('dbdump_artistalbumtrack.xml')

# http://www.linuxselfhelp.com/HOWTO/MP3-HOWTO-13.html#ss13.3
with open('id3genre.txt') as id3genre:
    id_to_genre = [genre.strip().split('.')[1] for genre in id3genre if genre.strip()]

id_to_genre = dict(enumerate(id_to_genre))
genres = set(xml.xpath('//id3genre/text()'))
index = map(lambda id: (id_to_genre[int(id)], int(id)), genres)
index = dict(index)

cover_format = "http://api.jamendo.com/get2/image/album/redirect/?id=%s&imagesize=100"
bigcover_format = "http://api.jamendo.com/get2/image/album/redirect/?id=%s&imagesize=400"

# create a mapping genreid->genre where genre is a dict with albums of this genre 
genres = map(lambda genre: (genre[1], dict(name=genre[0], albums=list())), index.items())
genres = dict(genres)
track_format = 'http://api.jamendo.com/get2/stream/track/redirect/?id=%s&streamencoding=mp31'

for artist in xml.xpath('/JamendoData/Artists/artist'):
    artist_name = artist.xpath('./name/text()')[0]
   
    for node in artist.xpath('./Albums/album'):
        id = node.xpath('./id/text()')[0]
        name = node.xpath('./name/text()')[0]
        release = node.xpath('./releasedate/text()')[0][:4]
        try:
            genre_id = node.xpath('./id3genre/text()')[0]
            genre_id = int(genre_id)
        except IndexError:
            continue
        cover = cover_format % id
        album = dict(id=id, name=name, release=release, artist=artist_name, cover=cover)
        genres[genre_id]['albums'].append(album)

        # build info file for this album
        albumtracks = dict(album)
        albumtracks['tracks'] = tracks = []
        albumtracks['cover'] = bigcover_format % id
        try:
            for track in node.xpath('./Tracks/track'):
                id = track.xpath('./id/text()')[0]
                mp3 = track_format % id
                track = dict(
                    name=track.xpath('./name/text()')[0],
                    position=int(track.xpath('./numalbum/text()')[0]),
                    mp3=mp3
                )
                tracks.append(track)
            tracks.sort(key=lambda track: track['position'])
            filepath = os.path.join('albums', '%s.json' % album['id'])
            with open(filepath, 'w') as f:
                dump(albumtracks, f)
        except IndexError:
            # missing info, drop the album!
            genres[genre_id]['albums'].remove(album)

dropped_albums = list()
index = list()

for genre_id, genre in genres.items():
    # drop genres that are too big
    if len(genre['albums']) > 300:
        dropped_albums.extend(genre['albums'])
    else:
        index.append((genre['name'], genre_id))
        filepath = os.path.join('genres', '%s.json' % genre_id)
        with open(filepath, 'w') as f:
            dump(genre, f)


#remove albums that are in droped genres
from os import remove

for album in dropped_albums:
    album = 'albums/%s.json' % album['id']
    remove(album)

# rebuild the index
with open('genres.json', 'w') as f:
    dump(dict(index), f)
