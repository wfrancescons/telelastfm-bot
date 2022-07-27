const {
    getMusicListeningNow,
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
        } = await getMusicListeningNow(username)

        const { first_name } = ctx.update.message.from

        const html = `<b>${first_name}</b> ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n🎵 <b>${track}</b>` +
        `\n💽 ${album}` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n<a href='${image}'>📊</a> ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        return html

    } catch (error) {

    }
}

const alb = async (username, ctx) => {
    try {
        const {
            track,
            album,
            artist,
            image,
            userplaycount,
            isNowPlaying
        } = await getAlbumListeningNow(username)

        const { first_name } = ctx.update.message.from

        const html = `<b>${first_name}</b> ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n💽 <b>${album}</b>` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n<a href='${image}'>📊</a> ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        return html

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

        const html = `<b>${first_name}</b> ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n🧑‍🎤 <b>${artist}</b> \n` +
        `\n<a href='${image}'>📊</a> ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        return html

    } catch (error) {

    }
}

module.exports = {
    ln,
    alb,
    art
}