const {
    getTrackListeningNow,
    getAlbumListeningNow,
    getArtistListeningNow
} = require('./controller/lastFm')

const ln = async (username, ctx) => {
    try {
        const {
            track,
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getTrackListeningNow(username)

        const { first_name } = ctx.update.message.from

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n🎵 ${track}` +
        `\n💽 ${album}` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(track),
            length: track.length,
            type: 'bold',
        },
        {
            offset: text.indexOf('📊'),
            length: '📊'.length,
            type: 'text_link',
            url: image
        }]

        return { text, entities }

    } catch (error) {

    }
}

const alb = async (username, ctx) => {
    try {
        const {
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getAlbumListeningNow(username)

        const { first_name } = ctx.update.message.from

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n💽 ${album}` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(album),
            length: album.length,
            type: 'bold',
        },
        {
            offset: text.indexOf('📊'),
            length: '📊'.length,
            type: 'text_link',
            url: image
        }]

        return { text, entities }

    } catch (error) {

    }
}

const art = async (username, ctx) => {
    try {
        const {
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getArtistListeningNow(username)

        const { first_name } = ctx.update.message.from

        const text = `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        const entities = [{
            offset: text.indexOf(first_name),
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: text.indexOf(artist),
            length: artist.length,
            type: 'bold',
        },
        {
            offset: text.indexOf('📊'),
            length: '📊'.length,
            type: 'text_link',
            url: image
        }]

        return { text, entities }

    } catch (error) {

    }
}

module.exports = {
    ln,
    alb,
    art
}