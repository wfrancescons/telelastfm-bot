import Spotify from 'spotify-web-api-node'
import config from '../config.js'

const { spotifyClientId, spotifyClientSecret } = config

const spotify = new Spotify({
    clientId: spotifyClientId,
    clientSecret: spotifyClientSecret
})

const generateAccessToken = () => {
    return new Promise((resolve, reject) => {
        spotify.clientCredentialsGrant()
            .then(data => {
                resolve(data.body['access_token'])
            })
            .catch(error => reject(error))
    })
}

const searchArtist = (artist) => {
    return new Promise((resolve, reject) => {
        generateAccessToken()
            .then(token => {
                const spotifyApi = new Spotify({ accessToken: token })
                spotifyApi.searchArtists(artist, { limit: 1 })
                    .then(data => {
                        const result = data.body
                        resolve(result)
                    })
                    .catch(error => reject(error))
            }
            )
            .catch(error => reject(error))
    })
}

const getArtist = (artistId) => {
    return new Promise((resolve, reject) => {
        generateAccessToken()
            .then(token => {
                const spotifyApi = new Spotify({ accessToken: token })
                spotifyApi.getArtist(artistId)
                    .then(data => {
                        const result = data.body
                        resolve(result)
                    })
                    .catch(error => reject(error))
            }
            )
            .catch(error => reject(error))
    })
}

const searchTrack = (track, artist) => {
    return new Promise((resolve, reject) => {
        generateAccessToken()
            .then(token => {
                const spotifyApi = new Spotify({ accessToken: token })
                spotifyApi.searchTracks(`track:${track} artist:${artist}`, { limit: 1 })
                    .then(data => {
                        const result = data.body
                        resolve(result)
                    })
                    .catch(error => reject(error))
            })
            .catch(error => reject(error))
    })
}

export {
    searchArtist,
    searchTrack,
    getArtist
}
