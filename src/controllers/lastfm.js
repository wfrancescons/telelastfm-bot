import axios from 'axios'
import config from '../config.js'
import { getSpotifyId } from './musicbrainz.js'
import {
  getArtist,
  searchArtist as spotifySearchArtist,
  searchTrack as spotifySearchTrack
} from './spotify.js'

const { get } = axios
const { lastfmURL, lastfmToken } = config

const getRecentTracks = (username, limit = 1) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getRecentTracks',
        format: 'json',
        api_key: lastfmToken,
        username,
        limit,
      },
      timeout: 1000 * 5
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
              isNowPlaying,
            }
          })

          resolve(tracks)
        }
      })
      .catch((error) => {
        error.response.status === 403
          ? reject('PRIVATE_USER')
          : reject(error)
      })
  })
}

const getTrackListeningNow = (username) => {
  return new Promise((resolve, reject) => {
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
          timeout: 1000 * 5
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
            })
          })
          .catch((erro) => reject(erro))
      })
      .catch((erro) => reject(erro))
  })
}

const getAlbumListeningNow = (username) => {
  return new Promise((resolve, reject) => {
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
          timeout: 1000 * 5
        })
          .then((response) => {
            resolve({
              artist,
              album,
              image,
              userplaycount: Number(response.data.album?.userplaycount) || 0,
              isNowPlaying,
            })
          })
          .catch((erro) => reject(erro))
      })
      .catch((erro) => reject(erro))
  })
}

const getArtistListeningNow = (username) => {
  return new Promise((resolve, reject) => {
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
          timeout: 1000 * 5
        })
          .then((response) => {
            resolve({
              artist,
              image,
              userplaycount:
                Number(response.data.artist.stats?.userplaycount) || 0,
              isNowPlaying,
            })
          })
          .catch((erro) => reject(erro))
      })
      .catch((erro) => reject(erro))
  })
}

const getUserTopTracks = (username, period, limit = 5) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getTopTracks',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit
      },
      timeout: 1000 * 5
    })
      .then(async (response) => {
        if (response.data.toptracks.track.length === 0) {
          reject('ZERO_SCROBBLES')
        } else {
          const tracks = response.data.toptracks.track
          const result = await Promise.all(
            tracks.map(async item => {

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
      .catch((erro) => reject(erro))
  })
}

const getUserTopAlbums = (username, period, limit = 5) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getTopAlbums',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit,
      },
      timeout: 1000 * 5
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
      .catch((erro) => reject(erro))
  })
}

const getUserTopArtists = (username, period, limit = 5) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getTopArtists',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit
      },
      timeout: 1000 * 5
    })
      .then(async (response) => {
        if (response.data.topartists.artist.length === 0) {
          reject('ZERO_SCROBBLES')

        } else {
          const artists = response.data.topartists.artist
          const result = await Promise.all(
            artists.map(async item => {

              let image = item?.image.pop()['#text']
              if (image === '') {
                image = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'
              }

              let spotify_id
              if (item?.mbid) spotify_id = await getSpotifyId(item.mbid)

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
      .catch((erro) => reject(erro))
  })
}

const getUserTopArtistsCollage = (username, period, limit = 5) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getTopArtists',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit
      },
      timeout: 1000 * 5
    })
      .then(async (response) => {
        if (response.data.topartists.artist.length === 0) {
          reject('ZERO_SCROBBLES')

        } else {
          const artists = response.data.topartists.artist
          const result = await Promise.all(
            artists.map(async item => {

              let image = item?.image.pop()['#text']
              if (image === '') {
                image = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'
              }

              const spotifyInfo = await spotifySearchArtist(item.name)
              if (spotifyInfo.artists.items.length !== 0) {
                const image_url = spotifyInfo.artists.items[0].images[0].url
                image = image_url
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
      .catch((erro) => reject(erro))
  })
}

const getUserInfo = (username) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getInfo',
        user: username,
        api_key: lastfmToken,
        format: 'json',
      },
      timeout: 1000 * 5
    })
      .then((response) => {
        resolve(response.data)
      })
      .catch((erro) => {
        erro.response.status === 404 ? reject('NOT_A_VALID_LASTFM_USER') : reject(erro)
      })
  })
}

const getTrackInfo = (track, artist) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'track.getInfo',
        track,
        artist,
        autocorrect: 1,
        api_key: lastfmToken,
        format: 'json',
      },
      timeout: 1000 * 5
    })
      .then((response) => {
        resolve(response.data)
      })
      .catch((erro) => {
        erro.response.status === 404
          ? resolve('NOT_A_VALID_LASTFM_USER')
          : reject(erro)
      })
  })
}

const getWeeklyTrackChart = (username) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getweeklytrackchart',
        user: username,
        api_key: lastfmToken,
        format: 'json',
      },
      timeout: 1000 * 5
    })
      .then((response) => {
        resolve(response.data)
      })
      .catch((erro) => {
        erro.response.status === 404 ? reject('NOT_A_VALID_LASTFM_USER') : reject(erro)
      })
  })
}

export {
  getRecentTracks,
  getTrackListeningNow,
  getAlbumListeningNow,
  getArtistListeningNow,
  getUserTopAlbums,
  getUserTopTracks,
  getUserTopArtists,
  getUserInfo,
  getTrackInfo,
  getWeeklyTrackChart,
  getUserTopArtistsCollage
}

