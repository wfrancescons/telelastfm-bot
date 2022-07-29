const axios = require('axios')

const lastfmURL = process.env.LASTFM_URL_API
const lastfmToken = process.env.LASTFM_TOKEN_API

const getRecentTracks = async (username, limit = 1) => {
    try {
        const { data } = await axios.get(lastfmURL, {
            params: {
                method: 'user.getRecentTracks',
                format: 'json',
                api_key: lastfmToken,
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

const getTrackListeningNow = async (username) => {
    try {
        const lastTrack = await getRecentTracks(username)
        const { track, album, artist, isNowPlaying, image } = lastTrack[0]

        const { data } = await axios.get(lastfmURL, {
            params: {
                method: 'track.getInfo',
                username,
                api_key: lastfmToken,
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

        const { data } = await axios.get(lastfmURL, {
            params: {
                method: 'album.getInfo',
                username,
                api_key: lastfmToken,
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

        const { data } = await axios.get(lastfmURL, {
            params: {
                method: 'artist.getInfo',
                username,
                api_key: lastfmToken,
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

const isValidUser = async (username) => {
    try {
        const { status } = await axios.get(lastfmURL, {
            params: {
                method: 'user.getInfo',
                user: username,
                api_key: lastfmToken,
                format: 'json'
            }
        })
    
        return true

    } catch (error) {
        if (error.response.status === 404) {
            return false
        }
    }
    
}

module.exports = {
    getRecentTracks,
    getTrackListeningNow,
    getAlbumListeningNow,
    getArtistListeningNow,
    isValidUser
}