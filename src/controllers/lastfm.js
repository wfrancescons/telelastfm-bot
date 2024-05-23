import axios from 'axios'
import { RateLimiter } from 'limiter'
import config from '../config.js'
import { getSpotifyId } from './musicbrainz.js'
import {
  getArtist,
  searchArtist as spotifySearchArtist,
  searchTrack as spotifySearchTrack
} from './spotify.js'

const { get } = axios
const { lastfmURL, lastfmToken } = config
const TIMEOUT = 1000 * 5

const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 200 })

function getRecentTracks(username, limit = 1) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    get(lastfmURL, {
      params: {
        method: 'user.getRecentTracks',
        format: 'json',
        api_key: lastfmToken,
        username,
        limit,
      },
      timeout: TIMEOUT
    })
      .then((response) => {
        if (response.data.recenttracks.track.length === 0) {
          reject('ZERO_SCROBBLES')
        } else {
          const tracks = response.data.recenttracks.track.map((track) => {
            const isNowPlaying = track['@attr']?.nowplaying ? true : false

            let image = track.image.pop()['#text']

            if (image === '') {
              image = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'
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
        }
      })
      .catch((error) => {
        const error_status = error.response?.status
        if (error_status === 403) reject('PRIVATE_USER')
        else if (error_status === 404) reject('USER_CHANGED_USERNAME')
        else reject(error)
      })
  })
}

function getTrackListeningNow(username) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    getRecentTracks(username)
      .then((lastTrack) => {
        const { track, album, artist, isNowPlaying, image } = lastTrack[0]

        get(lastfmURL, {
          params: {
            method: 'track.getInfo',
            username,
            api_key: lastfmToken,
            track,
            artist,
            autocorrect: 1,
            format: 'json',
          },
          timeout: TIMEOUT
        })
          .then((response) => {
            resolve({
              track,
              artist,
              album,
              image,
              userplaycount: Number(response.data.track?.userplaycount) || 0,
              lovedtrack: Boolean(Number(response.data.track?.userloved)),
              isNowPlaying,
              tags: response.data.track?.toptags?.tag
            })
          })
          .catch((erro) => reject(erro))
      })
      .catch((erro) => reject(erro))
  })
}

function getAlbumListeningNow(username) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    getRecentTracks(username)
      .then((lastTrack) => {
        const { album, artist, isNowPlaying, image } = lastTrack[0]

        get(lastfmURL, {
          params: {
            method: 'album.getInfo',
            username,
            api_key: lastfmToken,
            album,
            artist,
            autocorrect: 1,
            format: 'json',
          },
          timeout: TIMEOUT
        })
          .then((response) => {
            resolve({
              artist,
              album,
              image,
              userplaycount: Number(response.data.album?.userplaycount) || 0,
              isNowPlaying
            })
          })
          .catch((erro) => reject(erro))
      })
      .catch((erro) => reject(erro))
  })
}

function getArtistListeningNow(username) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    getRecentTracks(username)
      .then((lastTrack) => {
        const { artist, isNowPlaying, image } = lastTrack[0]

        get(lastfmURL, {
          params: {
            method: 'artist.getInfo',
            username,
            api_key: lastfmToken,
            artist,
            autocorrect: 1,
            format: 'json',
          },
          timeout: TIMEOUT
        })
          .then((response) => {
            resolve({
              artist,
              image,
              userplaycount: Number(response.data.artist.stats?.userplaycount) || 0,
              isNowPlaying,
            })
          })
          .catch((erro) => reject(erro))
      })
      .catch((erro) => reject(erro))
  })
}

function getUserTopTracks(username, period, limit = 5) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    get(lastfmURL, {
      params: {
        method: 'user.getTopTracks',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit
      },
      timeout: TIMEOUT
    })
      .then(async (response) => {
        if (response.data.toptracks.track.length === 0) {
          reject('ZERO_SCROBBLES')
        } else {
          const tracks = response.data.toptracks.track
          const result = await Promise.all(
            tracks.map(async (item) => {

              let image = item.image.pop()['#text']
              if (image === '') {
                image = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'
              }

              const spotify_info = await spotifySearchTrack(item.name, item.artist.name)

              if (spotify_info.tracks.items.length !== 0) {
                const image_url = spotify_info.tracks.items[0].album.images[0].url
                image = image_url
              }

              return {
                rank: item['@attr'].rank,
                image,
                text: [item.name, item.artist.name],
                scrobbles: item.playcount,
              }

            })
          )

          resolve(result)
        }
      })
      .catch((error) => {
        const error_status = error.response?.status
        if (error_status === 403) reject('PRIVATE_USER')
        else if (error_status === 404) reject('USER_CHANGED_USERNAME')
        else reject(error)
      })
  })
}

function getUserTopAlbums(username, period, limit = 5) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    get(lastfmURL, {
      params: {
        method: 'user.getTopAlbums',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit,
      },
      timeout: TIMEOUT
    })
      .then((response) => {
        if (response.data.topalbums.album.length === 0) {
          reject('ZERO_SCROBBLES')
        } else {

          const array = response.data.topalbums.album.map((item) => {

            let image = item.image.pop()['#text']
            if (image === '') {
              image = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'
            }

            return {
              rank: item['@attr'].rank,
              image,
              text: [item.name, item.artist.name],
              scrobbles: item.playcount,
            }
          })
          resolve(array)
        }
      })
      .catch((error) => {
        const error_status = error.response?.status
        if (error_status === 403) reject('PRIVATE_USER')
        else if (error_status === 404) reject('USER_CHANGED_USERNAME')
        else reject(error)
      })
  })
}

function getUserTopArtists(username, period, limit = 5) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    get(lastfmURL, {
      params: {
        method: 'user.getTopArtists',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit
      },
      timeout: TIMEOUT
    })
      .then(async (response) => {
        if (response.data.topartists.artist.length === 0) {
          reject('ZERO_SCROBBLES')

        } else {
          const artists = response.data.topartists.artist
          const result = await Promise.all(
            artists.map(async (item) => {

              let image = item?.image.pop()['#text']
              if (image === '') {
                image = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'
              }

              let spotify_id
              if (item?.mbid || item.name.length <= 4) spotify_id = await getSpotifyId(item.mbid)

              if (spotify_id) {

                const spotifyInfo = await getArtist(spotify_id)
                if (spotifyInfo) image = spotifyInfo.images[0].url

              } else {

                const spotifyInfo = await spotifySearchArtist(item.name)
                if (spotifyInfo.artists.items.length !== 0) {
                  const image_url = spotifyInfo.artists.items[0].images[0].url
                  image = image_url
                }

              }

              return {
                rank: item['@attr'].rank,
                image,
                text: [item.name],
                scrobbles: item.playcount,
              }

            })

          )

          resolve(result)

        }
      })
      .catch((error) => {
        const error_status = error.response?.status
        if (error_status === 403) reject('PRIVATE_USER')
        else if (error_status === 404) reject('USER_CHANGED_USERNAME')
        else reject(error)
      })
  })
}

function getUserInfo(username) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    get(lastfmURL, {
      params: {
        method: 'user.getInfo',
        user: username,
        api_key: lastfmToken,
        format: 'json',
      },
      timeout: TIMEOUT
    })
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        error.response?.status === 404 ? reject('NOT_A_VALID_LASTFM_USER') : reject(erro)
      })
  })
}

function getTrackInfo(track, artist) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    get(lastfmURL, {
      params: {
        method: 'track.getInfo',
        track,
        artist,
        autocorrect: 1,
        api_key: lastfmToken,
        format: 'json',
      },
      timeout: TIMEOUT
    })
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        const error_status = error.response?.status
        if (error_status === 403) reject('PRIVATE_USER')
        else if (error_status === 404) reject('USER_CHANGED_USERNAME')
        else reject(error)
      })
  })
}

function getWeeklyTrackChart(username) {
  return new Promise(async (resolve, reject) => {
    await limiter.removeTokens(1)

    get(lastfmURL, {
      params: {
        method: 'user.getweeklytrackchart',
        user: username,
        api_key: lastfmToken,
        format: 'json',
      },
      timeout: TIMEOUT
    })
      .then((response) => {
        resolve(response.data)
      })
      .catch((error) => {
        const error_status = error.response?.status
        if (error_status === 403) reject('PRIVATE_USER')
        else if (error_status === 404) reject('USER_CHANGED_USERNAME')
        else reject(error)
      })
  })
}

export {
  getAlbumListeningNow,
  getArtistListeningNow, getRecentTracks, getTrackInfo, getTrackListeningNow, getUserInfo, getUserTopAlbums, getUserTopArtists, getUserTopTracks, getWeeklyTrackChart
}

