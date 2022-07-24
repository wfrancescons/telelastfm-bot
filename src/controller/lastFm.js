const axios = require('axios')

const LASTFM_URL_API = 'https://ws.audioscrobbler.com/2.0/'
const LASTFM_TOKEN_API = '1604ac31e033845e2433d302147d7125'

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

const getListeningNow = async (username) => {
    try {
        const lastTrack = await getRecentTracks(username)
        const { track, artist, isNowPlaying } = lastTrack[0]

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
            track: data.track.name,
            duration: data.track.duration,
            artist: data.track.artist.name,
            album: data.track.album?.title || '',
            userplaycount: Number(data.track?.userplaycount) || 0,
            isNowPlaying
        }

        return listening

    } catch (error) {
        console.log('ERRO', error)
    }
}

//getListeningNow('wfrancescons').then(x => console.log(x))

module.exports = {
    getRecentTracks,
    getListeningNow,
}