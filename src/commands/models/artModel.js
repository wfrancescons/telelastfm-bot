function artModel(data) {

    const {
        isNowPlaying, artist, userplaycount, first_name, artist_nick, image
    } = data

    const text = [
        `${first_name} ${isNowPlaying ? 'is now' : 'was'} listening to:`,
        `\n🧑‍🎤 ${artist_nick ? `${artist_nick} (${artist})` : artist} \n`,
        `\n📈 ${(userplaycount + 1).toLocaleString('pt-BR')} ${userplaycount + 1 != 1 ? 'scrobbles so far' : 'scrobble so far'}`
    ]

    const slicedText = text.slice(0, 2)

    const artistIndex = text[0].length + '🧑‍🎤'.length + 2
    const imageIndex = slicedText.reduce((sum, current) => sum + current.length, 0) + 1

    const entities = [
        {
            offset: 0,
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: artistIndex,
            length: (artist_nick ? artist_nick : artist).length,
            type: 'bold',
        },
        {
            offset: imageIndex,
            length: '📈'.length,
            type: 'text_link',
            url: image,
        }
    ]

    if (artist_nick) {
        const artistIndex = text[0].length + '🧑‍🎤'.length + artist_nick.length + 4

        entities.push({
            offset: artistIndex,
            length: artist.length,
            type: 'italic',
        })
    }

    return {
        text: text.join(''),
        entities
    }

}

export default artModel