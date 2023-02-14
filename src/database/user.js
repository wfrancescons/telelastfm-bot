import { getUserInfo } from '../controllers/lastfm.js'
import User from '../database/models/user.js'

const createUser = (telegram_id, lastfm_username) => {

  return new Promise((resolve, reject) => {

    const newUser = new User({ telegram_id, lastfm_username, })
    newUser.save((error, data) => error ? reject(error) : resolve(data))

  })
}

const getUser = (telegram_id) => {

  return new Promise((resolve, reject) => {

    User.findOne({ telegram_id }, (erro, data) => {

      //if not found, returns null as data
      erro ? reject(erro) : resolve(data)

    })
  })
}

const updateUser = (telegram_id, lastfm_username) => {

  return new Promise((resolve, reject) => {

    User.findOneAndUpdate({ telegram_id }, { lastfm_username }, (erro, data) => {
      erro ? reject(erro) : resolve(data)
    }

    )
  })
}

const getLastfmUser = (telegram_id) => {

  return new Promise(async (resolve, reject) => {

    try {

      const user = await getUser(telegram_id)

      if (user) {
        resolve(user.lastfm_username)
      } else {
        reject('USER_NOT_FOUND')
      }

    } catch (erro) {

      reject(erro)

    }
  })
}

const setLastfmUser = (telegram_id, lastfm_username) => {

  return new Promise(async (resolve, reject) => {

    try {

      const user = await getUser(telegram_id)
      const userInfo = await getUserInfo(lastfm_username)

      if (!user && userInfo) {

        const newUser = await createUser(telegram_id, lastfm_username)
        resolve(newUser.lastfm_username)

      } else {

        const updatedUser = await updateUser(telegram_id, lastfm_username)
        resolve(updatedUser.lastfm_username)

      }
    } catch (erro) {

      reject(erro)

    }
  })
}

export { getLastfmUser, setLastfmUser, getUser }

