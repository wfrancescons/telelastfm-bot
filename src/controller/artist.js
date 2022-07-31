const Artist = require('../models/artists')

const createArtist = (chat_id) => {
    return new Promise((resolve, reject) => {
        const newArtist = new Artist({ chat_id })

        newArtist.save((erro, data) => {
            erro ? reject(erro) : resolve(data)
        })
    })
}

const createNick = (chat_id, artistNick) => {
    return new Promise((resolve, reject) => {
        Artist.findOne({ chat_id }, (erro, data) => {
            if (data) {
                data.artists.push(artistNick)
                data.save(erro => reject(erro))
                resolve(data)
            } else {
                reject(erro)
            }
        })
    })
}

const getNicks = (chat_id) => {
    return new Promise((resolve, reject) => {
        Artist.findOne({ chat_id }, (erro, data) => {
            erro ? reject(erro) : resolve(data?.artists)
        })
    })
}

const updateArtist = (chat_id, artistNick) => {

    const { artist_name } = artistNick

    return new Promise((resolve, reject) => {
        Artist.findOne({ chat_id }, (erro, data) => {
            if (data) {
                const index = data.artists.findIndex(artist => artist.artist_name === artist_name)

                if (index !== -1) {
                    data.artists.splice(index, 1)
                    data.artists.push(artistNick)

                    data.save(erro => reject(erro))
                    resolve(data)

                } else if (index === -1) {
                    resolve()
                } else {
                    reject(erro)
                }

            } else {
                reject(erro)
            }
        })
    })
}

const deleteArtist = (chat_id, artistNick) => {

    const { artist_name } = artistNick

    return new Promise((resolve, reject) => {
        Artist.findOne({ chat_id }, (erro, data) => {
            if (data) {
                const index = data.artists.findIndex(artist => {
                    artist.artist_name === artist_name
                })

                if (index !== -1) {
                    data.artists.splice(index, 1)

                    data.save(erro => reject(erro))
                    resolve(data)

                } else {
                    resolve()
                }

            } else {
                reject(erro)
            }
        })
    })
}

const newNick = (chat_id, artistNick) => {
    const { artist_name } = artistNick

    return new Promise(async (resolve, reject) => {
        try {
            let nicks = await getNicks(chat_id)

            if (!nicks) {
                const artist = await createArtist(chat_id)

                if (artist) {
                    const nick = await createNick(chat_id, artistNick)
                    resolve(nick)
                } else reject()

            } else {
                const index = nicks.findIndex(artist => artist.artist_name === artist_name)

                if (index !== -1) {
                    const updatedArtist = await updateArtist(chat_id, artistNick)
                    resolve(updatedArtist)

                } else if (index === -1) {
                    const nick = await createNick(chat_id, artistNick)
                    resolve(nick)
                } else {
                    reject(erro)
                }
            }

        } catch (erro) {
            reject(erro)
        }
    })
}

module.exports = {
    newNick,
    getNicks
}