import Artist from '../database/models/artists.js'

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
        data.save((erro) => reject(erro))
        resolve(data)
      } else {
        reject(erro)
      }
    })
  })
}

const getNick = (chat_id, artist) => {
  return new Promise((resolve, reject) => {
    Artist.findOne({ chat_id, 'artists.artist_name': artist }, (erro, data) => {
      erro ? reject(erro) : resolve(data)
    })
  })
}

const getAllNicks = (chat_id) => {
  return new Promise((resolve, reject) => {
    Artist.findOne({ chat_id }, (erro, data) => {
      erro ? reject(erro) : resolve(data?.artists)
    })
  })
}

const updateNick = (chat_id, artistNick) => {
  const { artist_name } = artistNick

  return new Promise((resolve, reject) => {
    Artist.findOne({ chat_id }, (erro, data) => {
      if (data) {
        const index = data.artists.findIndex(
          (artist) => artist.artist_name === artist_name
        )

        if (index !== -1) {
          data.artists.splice(index, 1)
          data.artists.push(artistNick)

          data.save((erro) => reject(erro))
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

const deleteNick = (chat_id, artistNick) => {
  return new Promise((resolve, reject) => {
    Artist.findOne({ chat_id }, (erro, data) => {
      if (data) {
        const index = data.artists.findIndex(
          (artist) => artist.artist_name === artistNick
        )

        if (index !== -1) {
          data.artists.splice(index, 1)
          data.save((erro) => reject(erro))

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

export { newNick, getAllNicks, deleteNick, getNick }
