import Spotify from 'spotify-web-api-node'
import config from '../config.js'

const { spotifyClientId, spotifyClientSecret } = config

const spotify = new Spotify({
    clientId: spotifyClientId,
    clientSecret: spotifyClientSecret
})

async function generateAccessToken() {
    const data = await spotify.clientCredentialsGrant()

    spotify.setAccessToken(data.body.access_token)
    spotify.setRefreshToken(data.body.refresh_token)

    console.log('SPOTIFY API: New access token generated')
}

async function initTokenRefresh() {
    await generateAccessToken()
    setInterval(async () => {
        await generateAccessToken()
    }, 60 * 60 * 1000) // refresh every 1 hour
}

initTokenRefresh()

function searchArtist(artist) {
    return new Promise(async (resolve, reject) => {
        try {
            const { body } = await spotify.searchArtists(artist, { limit: 1 })
            resolve(body)

        } catch (error) {
            reject(error)
        }
    })
}

function getArtist(artistId) {
    return new Promise(async (resolve, reject) => {
        try {
            const { body } = await spotify.getArtist(artistId)
            resolve(body)

        } catch (error) {
            reject(error)
        }
    })
}

function searchTrack(track, artist) {
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
    getArtist, searchArtist,
    searchTrack
}
