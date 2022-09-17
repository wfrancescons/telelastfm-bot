import { jest, describe, expect, it } from '@jest/globals'
import { getLastfmUser } from '../src/controller/user.js'
import mockingoose from 'mockingoose'
import User from '../src/database/models/user.js'
import { getUserInfo } from '../src/controller/lastfm.js'


/* jest.mock('../src/controller/lastfm.js', () => {
    const originalModule = jest.requireActual('../src/controller/lastfm.js')
    return {
        __esModule: true,
        ...originalModule,
        //default: jest.fn(() => 'mocked baz'),

        //Mocked Function
        getUserInfo: Promise.reject('USER_NOT_FOUND'),
    }
}) */

jest.mock('../src/controller/user.js')

describe(`If not bot's user`, () => {

    beforeEach(() => {
        mockingoose.resetAll();
        //jest.clearAllMocks();
    });

    it(`Don't has telegram's username`, () => {
        const ctx = {
            message: {
                from: {
                    id: 123456
                }
            }
        }

        mockingoose(User).toReturn(null, 'findOne')

        expect(getLastfmUser(ctx)).rejects.toBe('USER_NOT_FOUND')
    })

    it(`Has a telegram's username, but it isn't a valid lastfm's username`, () => {
        jest.doMock('../src/controller/lastfm.js', () => {
            //const originalModule = jest.requireActual('../src/controller/lastfm.js')
            return {
                __esModule: true,
                //...originalModule,
                //default: jest.fn(() => 'mocked baz'),

                //Mocked Function
                getUserInfo: jest.fn(() => Promise.resolve('USER_NOT_FOUND')),
            }
        })

        const ctx = {
            message: {
                from: {
                    id: 123456,
                    username: 'notValidUsername'
                }
            }
        }

        mockingoose(User).toReturn(null, 'findOne')

        expect(getLastfmUser(ctx)).rejects.toBe('USER_NOT_FOUND')
    })

    /* it(`Has a telegram's username and it is a valid lastfm's username`, async () => {

        jest.doMock('../src/controller/lastfm.js', () => {
            //const originalModule = jest.requireActual('../src/controller/lastfm.js')
            return {
                __esModule: true,
                //...originalModule,
                //default: jest.fn(() => 'mocked baz'),

                //Mocked Function
                getUserInfo: jest.fn(() => Promise.resolve('USER_NOT_FOUND')),
            }
        })

        const ctx = {
            message: {
                from: {
                    id: 123456,
                    username: 'validUsername'
                }
            }
        }
        mockingoose(User).toReturn(null, 'findOne')

        expect(getLastfmUser(ctx)).rejects.toBe('USER_NOT_FOUND')

    }) */


})