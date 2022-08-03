const axios = require('axios')

const lastfmURL = process.env.LASTFM_URL_API
const lastfmToken = process.env.LASTFM_TOKEN_API

const getRecentTracks = (username, limit = 1) => {
    return new Promise((resolve, reject) => {
        axios.get(lastfmURL, {
            params: {
                method: 'user.getRecentTracks',
                format: 'json',
                api_key: lastfmToken,
                username,
                limit
            }
        })
            .then(response => {
                const tracks = response.data.recenttracks.track.map(track => {
                    const isNowPlaying = track['@attr']?.nowplaying ? true : false
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

                resolve(tracks)

            })
            .catch(erro => reject(erro))
    })
}

const getTrackListeningNow = (username) => {
    return new Promise((resolve, reject) => {
        getRecentTracks(username)
            .then(lastTrack => {
                const { track, album, artist, isNowPlaying, image } = lastTrack[0]

                axios.get(lastfmURL, {
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
                    .then(response => {
                        resolve({
                            track,
                            artist,
                            album,
                            image,
                            userplaycount: Number(response.data.track?.userplaycount) || 0,
                            duration: response.data.track.duration,
                            isNowPlaying
                        })
                    })
                    .catch(erro => reject(erro))

            })
    })
}

const getAlbumListeningNow = (username) => {
    return new Promise((resolve, reject) => {
        getRecentTracks(username)
            .then(lastTrack => {
                const { album, artist, isNowPlaying, image } = lastTrack[0]

                axios.get(lastfmURL, {
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
                    .then(response => {
                        resolve({
                            artist,
                            album,
                            image,
                            userplaycount: Number(response.data.album?.userplaycount) || 0,
                            isNowPlaying
                        })
                    })
                    .catch(erro => reject(erro))

            })
    })
}

const getArtistListeningNow = (username) => {
    return new Promise((resolve, reject) => {
        getRecentTracks(username)
            .then(lastTrack => {
                const { artist, isNowPlaying, image } = lastTrack[0]

                axios.get(lastfmURL, {
                    params: {
                        method: 'artist.getInfo',
                        username,
                        api_key: lastfmToken,
                        artist,
                        autocorrect: 1,
                        format: 'json'
                    }
                })
                    .then(response => {
                        resolve({
                            artist,
                            image,
                            userplaycount: Number(response.data.artist.stats?.userplaycount) || 0,
                            isNowPlaying
                        })
                    })
                    .catch(erro => reject(erro))

            })
    })
}

const getUserInfo = (username) => {
    return new Promise((resolve, reject) => {
        axios.get(lastfmURL, {
            params: {
                method: 'user.getInfo',
                user: username,
                api_key: lastfmToken,
                format: 'json'
            }
        })
            .then(response => {
                resolve(response.data)
            })
            .catch(erro => {
                erro.response.status === 404 ? resolve({ user: 'not found' }) : reject(erro)
            })
    })
}

module.exports = {
    getRecentTracks,
    getTrackListeningNow,
    getAlbumListeningNow,
    getArtistListeningNow,
    getUserInfo
}