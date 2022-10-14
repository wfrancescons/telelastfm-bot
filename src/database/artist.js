import Artist from './models/artists.js'

const createArtist = (chat_id) => {
  return new Promise((resolve, reject) => {
    const newArtist = new Artist({ chat_id })

    newArtist.save((erro, data) => {
      erro ? reject(erro) : resolve(data)
    })
  })
}

//TODO: Refactor
const createNick = (chat_id, artistNick) => {
  return new Promise((resolve, reject) => {
    Artist.findOne({ chat_id }, (erro, data) => {
      if (data) {
        data.artists.push(artistNick)
        data.save((erro) => reject(erro))
        resolve(data)
      } else {
        reject(erro)
      }
    })
  })
}

//OK
const getNick = (chat_id, artist) => {
  return new Promise((resolve, reject) => {
    Artist.findOne({ chat_id, 'artists.artist_name': artist }, { 'artists.$': 1 }, (erro, data) => {
      erro ? reject(erro) : resolve(data)
    })
  })
}

//OK
const getAllNicks = (chat_id) => {
  return new Promise((resolve, reject) => {
    Artist.findOne({ chat_id }, (erro, data) => {
      erro ? reject(erro) : resolve(data?.artists)
    })
  })
}

//OK
const updateNick = (chat_id, artistNick) => {
  const { artist_name, artist_nick } = artistNick

  return new Promise((resolve, reject) => {
    Artist.updateOne({ chat_id, 'artists.artist_name': artist_name }, {
      '$set': {
        'artists.$.artist_nick': artist_nick
      }
    }, (erro, data) => { erro ? reject(erro) : resolve(data) })
  })
}

//TODO: Refactor
const newNick = (chat_id, data) => {
  return new Promise(async (resolve, reject) => {

    const { artist_name } = data

    try {

      let nicks = await getAllNicks(chat_id)

      if (!nicks) {

        const artist = await createArtist(chat_id)

        if (artist) {

          const nick = await createNick(chat_id, data)
          resolve(nick)

        } else reject()

      } else {

        const index = nicks.findIndex((artist) => artist.artist_name === artist_name)

        if (index !== -1) {

          const updatedArtist = await updateNick(chat_id, data)
          resolve(updatedArtist)

        } else if (index === -1) {

          const nick = await createNick(chat_id, data)
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

//OK
const deleteNick = (chat_id, artistNick) => {
  return new Promise((resolve, reject) => {
    Artist.updateOne({ chat_id }, { $pull: { artists: { artist_name: artistNick } } }, (erro, data) => {
      if (erro) reject(erro)
      if (data.modifiedCount === 1) {
        resolve(data)
      } else {
        resolve(null)
      }
    })
  })
}

export { newNick, getAllNicks, deleteNick, getNick }
