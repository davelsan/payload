import type { Payload } from 'payload'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import configPromise from './config.js'

let payload: Payload

describe('@payloadcms/plugin-cloud', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(configPromise))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('tests', () => {
    it.todo('plugin-cloud tests')
  })
})
