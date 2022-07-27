const axios = require('axios')

const LASTFM_URL_API = process.env.LASTFM_URL_API
const LASTFM_TOKEN_API = process.env.LASTFM_TOKEN_API

const getRecentTracks = async (username, limit = 1) => {
    try {
        const { data } = await axios.get(LASTFM_URL_API, {
            params: {
                method: 'user.getRecentTracks',
                format: 'json',
                api_key: LASTFM_TOKEN_API,
                username,
                limit
            }
        })

        const tracks = data.recenttracks.track.map(track => {

            //verifica se a música está sendo reproduzida no momento (? = Optional Chaining)
            const isNowPlaying = track['@attr']?.nowplaying || false
            let image = track.image.pop()['#text']

            if (image === '') {
                image = 'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png'
            }

            return {
                track: track.name,
                artist: track.artist['#text'],
                album: track.album['#text'],
                image,
                isNowPlaying
            }
        })

        return tracks

    } catch (error) {
        console.log('ERRO', error)
    }
}

const getMusicListeningNow = async (username) => {
    try {
        const lastTrack = await getRecentTracks(username)
        const { track, album, artist, isNowPlaying, image } = lastTrack[0]

        const { data } = await axios.get(LASTFM_URL_API, {
            params: {
                method: 'track.getInfo',
                username,
                api_key: LASTFM_TOKEN_API,
                track,
                artist,
                autocorrect: 1,
                format: 'json'
            }
        })

        const listening = {
            track,
            artist,
            album,
            image,
            userplaycount: Number(data.track?.userplaycount) || 0,
            duration: data.track.duration,
            isNowPlaying
        }

        return listening

    } catch (error) {
        console.log('ERRO', error)
    }
}

const getAlbumListeningNow = async (username) => {
    try {
        const lastTrack = await getRecentTracks(username)
        const { album, artist, isNowPlaying, image } = lastTrack[0]

        const { data } = await axios.get(LASTFM_URL_API, {
            params: {
                method: 'album.getInfo',
                username,
                api_key: LASTFM_TOKEN_API,
                album,
                artist,
                autocorrect: 1,
                format: 'json'
            }
        })

        const listening = {
            artist,
            album,
            image,
            userplaycount: Number(data.album?.userplaycount) || 0,
            isNowPlaying
        }

        return listening

    } catch (error) {
        console.log('ERRO', error)
    }
}

const getArtistListeningNow = async (username) => {
    try {
        const lastTrack = await getRecentTracks(username)
        const { artist, isNowPlaying, image } = lastTrack[0]

        const { data } = await axios.get(LASTFM_URL_API, {
            params: {
                method: 'artist.getInfo',
                username,
                api_key: LASTFM_TOKEN_API,
                artist,
                autocorrect: 1,
                format: 'json'
            }
        })

        const listening = {
            artist,
            image,
            userplaycount: Number(data.artist.stats?.userplaycount) || 0,
            isNowPlaying
        }

        return listening

    } catch (error) {
        console.log('ERRO', error)
    }
}

module.exports = {
    getRecentTracks,
    getMusicListeningNow,
    getAlbumListeningNow,
    getArtistListeningNow
}