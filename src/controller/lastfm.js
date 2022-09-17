import axios from 'axios'
import config from '../config.js'

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
    })
      .then((response) => {
        if (response.data.recenttracks.track.length === 0) {
          reject('ZERO_SCROBBLES')
        } else {
          const tracks = response.data.recenttracks.track.map((track) => {
            const isNowPlaying = track['@attr']?.nowplaying ? true : false
            let image = track.image.pop()['#text']

            if (image === '') {
              image =
                'https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png'
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
      .catch((erro) => reject(erro))
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
        })
          .then((response) => {
            resolve({
              track,
              artist,
              album,
              image,
              userplaycount: Number(response.data.track?.userplaycount) || 0,
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

const getUserTopTracks = (username, period) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getTopTracks',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit: 5,
      },
    })
      .then(async (response) => {
        if (response.data.toptracks.track.length === 0) {
          reject('ZERO_SCROBBLES')
        } else {
          const array = []
          for (const item of response.data.toptracks.track) {
            const data = await getTrackInfo(item.name, item.artist.name)

            array.push({
              rank: item['@attr'].rank,
              image:
                data.track.album?.image.pop()['#text'] ||
                item.image.pop()['#text'],
              text: item.name,
              scrobbles: item.playcount,
            })
          }

          resolve(array)
        }
      })
      .catch((erro) => reject(erro))
  })
}

const getUserTopAlbums = (username, period) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getTopAlbums',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit: 5,
      },
    })
      .then((response) => {
        if (response.data.topalbums.album.length === 0) {
          reject('ZERO_SCROBBLES')
        } else {
          const array = response.data.topalbums.album.map((item) => {
            return {
              rank: item['@attr'].rank,
              image: item.image.pop()['#text'],
              text: item.name,
              scrobbles: item.playcount,
            }
          })
          resolve(array)
        }
      })
      .catch((erro) => reject(erro))
  })
}

const getUserTopArtists = (username, period) => {
  return new Promise((resolve, reject) => {
    get(lastfmURL, {
      params: {
        method: 'user.getTopArtists',
        format: 'json',
        api_key: lastfmToken,
        username,
        period,
        limit: 5,
      },
    })
      .then((response) => {
        if (response.data.topartists.artist.length === 0) {
          reject('ZERO_SCROBBLES')
        } else {
          const array = response.data.topartists.artist.map((item) => {
            return {
              rank: item['@attr'].rank,
              image: item.image.pop()['#text'],
              text: item.name,
              scrobbles: item.playcount,
            }
          })
          resolve(array)
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
    })
      .then((response) => {
        resolve(response.data)
      })
      .catch((erro) => {
        erro.response.status === 404 ? reject('USER_NOT_FOUND') : reject(erro)
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
    })
      .then((response) => {
        resolve(response.data)
      })
      .catch((erro) => {
        erro.response.status === 404
          ? resolve({ user: 'not found' })
          : reject(erro)
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
}
