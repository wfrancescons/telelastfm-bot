import Spotify from 'spotify-web-api-node'
import config from '../config.js'

const { spotifyClientId, spotifyClientSecret } = config

const spotify = new Spotify({
    clientId: spotifyClientId,
    clientSecret: spotifyClientSecret
})

const generateAccessToken = async () => {
    const data = await spotify.clientCredentialsGrant()

    spotify.setAccessToken(data.body.access_token)
    spotify.setRefreshToken(data.body.refresh_token)

    console.log('SPOTIFY API: New access token generated')
}

const initTokenRefresh = async () => {
    await generateAccessToken()
    setInterval(async () => {
        if (isAccessTokenExpired()) {
            await generateAccessToken()
        }
    }, 60 * 60 * 1000) // refresh every 1 hour
}

initTokenRefresh()

const searchArtist = (artist) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { body } = await spotify.searchArtists(artist, { limit: 1 })
            resolve(body)

        } catch (error) {
            reject(error)
        }
    })
}

const getArtist = (artistId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { body } = await spotify.getArtist(artistId)
            resolve(body)

        } catch (error) {
            reject(error)
        }
    })
}

const searchTrack = (track, artist) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { body } = await spotify.searchTracks(`track:${track} artist:${artist}`, { limit: 1 })
            resolve(body)

        } catch (error) {
            reject(error)
        }
    })
}

export {
    searchArtist,
    searchTrack,
    getArtist
}

