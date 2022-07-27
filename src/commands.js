const { getMusicListeningNow } = require('./controller/lastFm')

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

        const { first_name: telegram_first_name } = ctx.update.message.from

        const html = `<b>${telegram_first_name}</b> ${isNowPlaying ? 'is now' : 'was'} listening to:` +
        `\n🎵 <b>${track}</b>` +
        `\n💽 ${album}` +
        `\n🧑‍🎤 ${artist} \n` +
        `\n<a href='${image}'>📊</a> ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        return html

    } catch (error) {

    }
}

module.exports = {
    ln
}