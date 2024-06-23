import Bottleneck from 'bottleneck'
import * as cheerio from 'cheerio'

import config from '../config.js'
import request from '../utils/request.js'

const { lastfm_token } = config
const lastfm_url_api = 'https://ws.audioscrobbler.com/2.0/'

const DEFAULT_IMAGE = 'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'

const apiLimiter = new Bottleneck({
  minTime: 200
})

const webScrappingLimiter = new Bottleneck({
  maxConcurrent: 10,
  minTime: 200
})

function buildUrl(params) {
  const url = new URL(lastfm_url_api)
  url.search = new URLSearchParams({ ...params, api_key: lastfm_token, format: 'json' })
  return url.toString()
}

const makeRequest = apiLimiter.wrap(async function makeRequest(params) {
  const url = buildUrl(params)
  console.log(url)
  const response = await request({ url })

  if (!response.ok) {
    throw response
  }

  const data = JSON.parse(await response.text())
  return data
})

function extractImage(images) {
  let image = images.pop()['#text']
  if (image === '') {
    image = DEFAULT_IMAGE
  }

  const originalImageCropRegex = /\/\d+x\d+\//

  return {
    small: image.replace(originalImageCropRegex, '/34s/'),
    medium: image,
    large: image.replace(originalImageCropRegex, '/500x500/'),
    extralarge: image.replace(originalImageCropRegex, '/770x0/'),
  }
}

async function getOgImage(url) {
  try {
    const html = await request({ url })
    console.log(html.status, html.statusText)
    const $ = cheerio.load(await html.text())
    const ogImage = $('meta[property="og:image"]').attr('content')

    console.log(ogImage)

    if (!ogImage) return DEFAULT_IMAGE

    return ogImage.replace('ar0', '300x300')

  } catch (error) {
    console.error(error)
    return null
  }
}

async function getRecentTracks(username, limit = 1) {
  try {
    const lastfm_data = await makeRequest({
      method: 'user.getRecentTracks',
      username,
      limit
    })

    const recent_tracks = lastfm_data.recenttracks?.track

    if (!Array.isArray(recent_tracks)) throw 'COMMON_ERROR'
    if (recent_tracks.length === 0) throw 'ZERO_SCROBBLES'

    const data = []
    for (const track of recent_tracks) {
      data.push({
        track: track.name,
        artist: track.artist['#text'],
        album: track.album['#text'],
        image: extractImage(track.image),
        isNowPlaying: track['@attr']?.nowplaying ? true : false
      })
    }

    return data

  } catch (error) {
    handleRequestError(error)
  }
}

async function getTrackListeningNow(username) {
  try {
    const recent_tracks = await getRecentTracks(username)
    const { track, artist } = recent_tracks[0]
    const track_info = await getTrackInfo({ track, artist, username })

    const data = {
      ...recent_tracks[0],
      userplaycount: track_info.userplaycount,
      lovedtrack: track_info.lovedtrack,
      tags: track_info.tags
    }

    return data

  } catch (error) {
    throw error
  }
}

async function getAlbumListeningNow(username) {
  try {
    const last_track = await getRecentTracks(username)
    const { album, artist } = last_track[0]
    const album_info = await getAlbumInfo({ album, artist, username })

    if (album_info.image) last_track[0].image = album_info.image

    const data = {
      ...last_track[0],
      userplaycount: album_info.userplaycount || 0,
      tags: album_info.tags
    }

    return data

  } catch (error) {
    throw error
  }
}

async function getArtistListeningNow(username) {
  try {
    const lastTrack = await getRecentTracks(username)
    const { artist } = lastTrack[0]
    const artist_info = await getArtistInfo({ artist, username })

    if (artist_info.image) lastTrack[0].image = artist_info.image

    const data = {
      ...lastTrack[0],
      userplaycount: artist_info.userplaycount,
      tags: artist_info.tags
    }

    return data

  } catch (error) {
    throw error
  }
}

async function getUserTopTracks(username, period, limit = 5) {
  try {
    const data = await makeRequest({
      method: 'user.getTopTracks',
      username,
      period,
      limit
    })

    if (data.toptracks.track.length === 0) {
      throw new Error('ZERO_SCROBBLES')
    }

    const topTracks = data.toptracks.track

    const tracksPromises = topTracks.map((artist) => {
      return webScrappingLimiter.schedule(async () => {
        const artistUrl = artist.url
        const ogImage = await getOgImage(artistUrl)
        if (ogImage) {
          artist.image = [
            {
              "size": "small",
              "#text": ogImage
            }
          ]
        }
        return artist
      })
    })

    const updatedTracks = await Promise.all(tracksPromises)

    return updatedTracks.map(item => ({
      rank: item['@attr'].rank,
      image: extractImage(item.image),
      track: {
        name: item.name,
        artist: item.artist.name
      },
      scrobbles: item.playcount
    }))

  } catch (error) {
    handleRequestError(error)
  }
}

async function getUserTopAlbums(username, period, limit = 5) {
  try {
    const data = await makeRequest({
      method: 'user.getTopAlbums',
      username,
      period,
      limit
    })

    if (data.topalbums.album.length === 0) {
      throw new Error('ZERO_SCROBBLES')
    }

    return data.topalbums.album.map(item => ({
      rank: item['@attr'].rank,
      image: extractImage(item.image),
      album: {
        name: item.name,
        artist: item.artist.name
      },
      scrobbles: item.playcount
    }))
  } catch (error) {
    handleRequestError(error)
  }
}

async function getUserTopArtists(username, period, limit = 5) {
  try {
    const data = await makeRequest({
      method: 'user.getTopArtists',
      username,
      period,
      limit
    })

    if (data.topartists.artist.length === 0) {
      throw new Error('ZERO_SCROBBLES')
    }

    const topArtists = data.topartists.artist

    const artistPromises = topArtists.map((artist) => {
      return webScrappingLimiter.schedule(async () => {
        const artistUrl = artist.url
        const ogImage = await getOgImage(artistUrl)
        if (ogImage) {
          artist.image = [
            {
              "size": "small",
              "#text": ogImage
            }
          ]
        }
        return artist
      })
    })

    const updatedArtists = await Promise.all(artistPromises)

    return updatedArtists.map(item => ({
      rank: item['@attr'].rank,
      image: extractImage(item.image),
      artist: {
        name: item.name
      },
      scrobbles: item.playcount
    }))
  } catch (error) {
    handleRequestError(error)
  }
}


async function getLastfmUserData(username) {
  try {
    const data = await makeRequest({
      method: 'user.getInfo',
      user: username
    })

    return data

  } catch (error) {
    if (error.status === 404) throw 'NOT_A_VALID_LASTFM_USER'
    throw error
  }
}

async function getTrackInfo({ track, artist, mbid, username = null }) {
  try {
    const params = {
      method: 'track.getInfo',
      track,
      artist,
      autocorrect: 1
    }

    if (username) params.username = username

    const response = await makeRequest(params)

    const data = {
      track: response.track?.name || track,
      artist: response.track?.artist || artist,
      userplaycount: Number(response.track?.userplaycount) || 0,
      lovedtrack: Boolean(Number(response.track?.userloved)),
      tags: response.track?.toptags?.tag || []
    }

    if (response.track?.image && response.track?.image.length) {
      data.image = extractImage(response.track.image)
    }

    return data

  } catch (error) {
    handleRequestError(error)
  }
}

async function getAlbumInfo({ album, artist, username = null }) {
  try {
    const params = {
      method: 'album.getInfo',
      album,
      artist,
      autocorrect: 1
    }

    if (username) params.username = username

    const response = await makeRequest(params)

    const data = {
      album: response.album?.name || album,
      artist: response.album?.artist || artist,
      userplaycount: Number(response.album?.userplaycount) || 0,
      tags: response.album?.tags?.tag || []
    }

    if (response.album?.image?.length) {
      data.image = extractImage(response.album.image)
    }

    return data

  } catch (error) {
    if (error.status == 404) handleRequestError('CUSTOM_ALBUM_NOT_FOUND')
    handleRequestError(error)
  }
}

async function getArtistInfo({ artist, username = null }) {
  try {
    const params = {
      method: 'artist.getInfo',
      artist,
      autocorrect: 1
    }

    if (username) params.username = username

    const response = await makeRequest(params)

    if (response.error == 6) throw 'CUSTOM_ARTIST_NOT_FOUND'

    const data = {
      artist: response.artist?.name || artist,
      userplaycount: Number(response.artist?.stats?.userplaycount) || 0,
      tags: response.artist?.tags?.tag || []
    }

    if (response.artist?.image && response.artist?.image.length) {
      data.image = extractImage(response.artist.image)
    }

    return data

  } catch (error) {
    handleRequestError(error)
  }
}

async function getWeeklyTrackChart(username) {
  try {
    const data = await makeRequest({
      method: 'user.getweeklytrackchart',
      user: username
    })

    return data
  } catch (error) {
    handleRequestError(error)
  }
}

function handleRequestError(error) {
  const error_status = error.response?.status
  if (error_status === 403) {
    throw new Error('PRIVATE_USER')
  } else if (error_status === 404) {
    throw new Error('USER_CHANGED_USERNAME')
  } else {
    throw error
  }
}

export {
  extractImage, getAlbumInfo, getAlbumListeningNow, getArtistInfo, getArtistListeningNow,
  getLastfmUserData, getOgImage, getRecentTracks,
  getTrackInfo, getTrackListeningNow,
  getUserTopAlbums,
  getUserTopArtists,
  getUserTopTracks,
  getWeeklyTrackChart
}

