import { getLastfmUserData } from '../../services/lastfm.js'
import { Models } from '../database.js'

const { User } = Models

async function createUser(telegram_id, lastfm_username) {
  try {
    const user = await User.create({ telegram_id, lastfm_username })
    return user
  } catch (error) {
    throw error
  }
}

async function getUser(telegram_id) {
  try {
    const user = await User.findByPk(telegram_id)
    return user
  } catch (error) {
    throw error
  }
}

async function updateUser(telegram_id, lastfm_username) {
  try {
    const user = await User.findByPk(telegram_id)
    await user.update({ lastfm_username })
    return user

  } catch (error) {
    throw error
  }
}

async function getLastfmUser(telegram_id) {
  try {
    const user = await getUser(telegram_id)
    return user ? user.lastfm_username : null
  } catch (error) {
    throw error
  }
}

async function setLastfmUser(telegram_id, lastfm_username) {
  try {
    const userInfo = await getLastfmUserData(lastfm_username)
    const user = await getUser(telegram_id)

    if (!user && userInfo) {
      const newUser = await createUser(telegram_id, lastfm_username)
      return newUser
    } else {
      const updatedUser = await updateUser(telegram_id, lastfm_username)
      return updatedUser
    }
  } catch (error) {
    throw error
  }
}

async function countUsers() {
  try {
    const users_count = await User.count()
    return users_count
  } catch (error) {
    throw error
  }
}

export { countUsers, getLastfmUser, setLastfmUser }

