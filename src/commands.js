const { getListeningNow } = require('./controller/lastFm')

const ln = async (username) => {
    try {
        const {
            track,
            album,
            artist,
            userplaycount,
            isNowPlaying
        } = await getListeningNow(username)

        const text = `Wesley ${isNowPlaying ? 'is now' : 'was'} listening to:
        \n🎵 ${track}
        \n💽 ${album}
        \n🧑‍🎤 ${artist}
        \n
        \n📊 ${userplaycount + 1} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
        
        return console.log(text)

    } catch (error) {

    }
}

ln('wfrancescons')