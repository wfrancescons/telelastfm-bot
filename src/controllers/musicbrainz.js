import { MusicBrainzApi } from 'musicbrainz-api'

const mbAPI = new MusicBrainzApi({
    appName: 'telelastfm',
    appVersion: '2.2.0',
    appContactInfo: 'https://t.me/telelastfmbot'
})

function getArtistInfo(mbid) {
    return new Promise((resolve, reject) => {
        mbAPI.lookupArtist(mbid, ['url-rels'])
            .then(response => resolve(response))
            .catch(error => error.code === 'ERR_NON_2XX_3XX_RESPONSE' ? resolve(null) : reject(error))
    })
}

function getSpotifyURL(data) {
    const relations = data?.relations

    if (!relations) return

    const spotifyInfo = relations.find(item => {
        if (item['target-type'] === 'url' && item.url.resource.startsWith('https://open.spotify.com/artist/')) {
            return item.url.resource
        }
    })

    if (!spotifyInfo) return

    const spotifyURL = spotifyInfo.url.resource

    return spotifyURL
}

function getSpotifyId(mbid) {
    return new Promise((resolve, reject) => {
        getArtistInfo(mbid)
            .then(info => {
                const spotifyURL = getSpotifyURL(info)

                if (!spotifyURL) resolve(null)

                const spotifyId = spotifyURL.substring(spotifyURL.lastIndexOf('/') + 1)

                resolve(spotifyId)
            })
            .catch(error => error.status === 503 ? resolve(null) : reject(error))
    })
}

export { getSpotifyId }
