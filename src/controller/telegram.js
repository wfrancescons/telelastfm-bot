const lastFmController = require('./lastFm')

const format = (data) => {
    const text = `${from} ${isNowPlaying ? 'is now' : 'was'} listening to:
    \n🎵 ${track}
    \n💽 ${album}
    \n🧑‍🎤 ${artist}
    \n
    \n📊 ${scrobbles+1} ${scrobbles+1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
}