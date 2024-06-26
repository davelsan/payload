import type { Payload, Where } from 'payload'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { LocalizedPost, WithLocalizedRelationship } from './payload-types.js'

import { englishLocale } from '../globals/config.js'
import { idToString } from '../helpers/idToString.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { arrayCollectionSlug } from './collections/Array/index.js'
import { nestedToArrayAndBlockCollectionSlug } from './collections/NestedToArrayAndBlock/index.js'
import configPromise from './config.js'
import {
  defaultLocale,
  englishTitle,
  localizedPostsSlug,
  localizedSortSlug,
  portugueseLocale,
  relationEnglishTitle,
  relationEnglishTitle2,
  relationSpanishTitle,
  relationSpanishTitle2,
  relationshipLocalizedSlug,
  spanishLocale,
  spanishTitle,
  withLocalizedRelSlug,
  withRequiredLocalizedFields,
} from './shared.js'

const collection = localizedPostsSlug
let payload: Payload
let restClient: NextRESTClient

describe('Localization', () => {
  let post1: LocalizedPost
  let postWithLocalizedData: LocalizedPost

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(configPromise))

    // @ts-expect-error Force typing
    post1 = await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    })

    // @ts-expect-error Force typing
    postWithLocalizedData = await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    })

    await payload.update({
      id: postWithLocalizedData.id,
      collection,
      data: {
        title: spanishTitle,
      },
      locale: spanishLocale,
    })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Localized text', () => {
    it('create english', async () => {
      const allDocs = await payload.find({
        collection,
        where: {
          title: { equals: post1.title },
        },
      })
      expect(allDocs.docs).toContainEqual(expect.objectContaining(post1))
    })

    it('add spanish translation', async () => {
      const updated = await payload.update({
        id: post1.id,
        collection,
        data: {
          title: spanishTitle,
        },
        locale: spanishLocale,
      })

      expect(updated.title).toEqual(spanishTitle)

      const localized: any = await payload.findByID({
        id: post1.id,
        collection,
        locale: 'all',
      })

      expect(localized.title.en).toEqual(englishTitle)
      expect(localized.title.es).toEqual(spanishTitle)
    })

    it('should fallback to english translation when empty', async () => {
      await payload.update({
        id: post1.id,
        collection,
        data: {
          title: '',
        },
        locale: spanishLocale,
      })

      const retrievedInEnglish = await payload.findByID({
        id: post1.id,
        collection,
      })

      expect(retrievedInEnglish.title).toEqual(englishTitle)

      const localizedFallback: any = await payload.findByID({
        id: post1.id,
        collection,
        locale: 'all',
      })

      expect(localizedFallback.title.en).toEqual(englishTitle)
      expect(localizedFallback.title.es).toEqual('')
    })

    describe('fallback locales', () => {
      let englishData
      let spanishData
      let localizedDoc

      beforeAll(async () => {
        englishData = {
          localizedCheckbox: false,
        }
        spanishData = {
          localizedCheckbox: true,
          title: 'spanish title',
        }

        localizedDoc = await payload.create({
          collection: localizedPostsSlug,
          data: englishData,
          locale: englishLocale,
        })

        await payload.update({
          id: localizedDoc.id,
          collection: localizedPostsSlug,
          data: spanishData,
          locale: spanishLocale,
        })
        await payload.update({
          id: localizedDoc.id,
          collection: localizedPostsSlug,
          data: { localizedCheckbox: true },
          locale: portugueseLocale,
        })
      })

      it('should return localized fields using fallbackLocale specified in the requested locale config', async () => {
        const portugueseDoc = await payload.findByID({
          id: localizedDoc.id,
          collection: localizedPostsSlug,
          locale: portugueseLocale,
        })

        expect(portugueseDoc.title).toStrictEqual(spanishData.title)
        expect(portugueseDoc.localizedCheckbox).toStrictEqual(true)
      })
    })

    describe('querying', () => {
      let localizedPost: LocalizedPost
      beforeEach(async () => {
        const { id } = await payload.create({
          collection,
          data: {
            title: englishTitle,
          },
        })

        // @ts-expect-error Force typing
        localizedPost = await payload.update({
          id,
          collection,
          data: {
            title: spanishTitle,
          },
          locale: spanishLocale,
        })
      })

      it('unspecified locale returns default', async () => {
        const localized = await payload.findByID({
          id: localizedPost.id,
          collection,
        })

        expect(localized.title).toEqual(englishTitle)
      })

      it('specific locale - same as default', async () => {
        const localized = await payload.findByID({
          id: localizedPost.id,
          collection,
          locale: defaultLocale,
        })

        expect(localized.title).toEqual(englishTitle)
      })

      it('specific locale - not default', async () => {
        const localized = await payload.findByID({
          id: localizedPost.id,
          collection,
          locale: spanishLocale,
        })

        expect(localized.title).toEqual(spanishTitle)
      })

      it('all locales', async () => {
        const localized: any = await payload.findByID({
          id: localizedPost.id,
          collection,
          locale: 'all',
        })

        expect(localized.title.en).toEqual(englishTitle)
        expect(localized.title.es).toEqual(spanishTitle)
      })

      it('by localized field value - default locale', async () => {
        const result = await payload.find({
          collection,
          where: {
            title: {
              equals: englishTitle,
            },
          },
        })

        expect(result.docs.map(({ id }) => id)).toContain(localizedPost.id)
      })

      it('by localized field value - alternate locale', async () => {
        const result = await payload.find({
          collection,
          locale: spanishLocale,
          where: {
            title: {
              equals: spanishTitle,
            },
          },
        })

        expect(result.docs.map(({ id }) => id)).toContain(localizedPost.id)
      })

      it('by localized field value - opposite locale???', async () => {
        const result = await payload.find({
          collection,
          locale: 'all',
          where: {
            'title.es': {
              equals: spanishTitle,
            },
          },
        })

        expect(result.docs.map(({ id }) => id)).toContain(localizedPost.id)
      })
    })
  })

  describe('Localized Sort Count', () => {
    const expectedTotalDocs = 5
    beforeAll(async () => {
      for (let i = 1; i <= expectedTotalDocs; i++) {
        const post = await payload.create({
          collection: localizedSortSlug,
          data: {
            date: new Date(),
            title: `EN ${i}`,
          },
          locale: englishLocale,
        })

        await payload.update({
          id: post.id,
          collection: localizedSortSlug,
          data: {
            date: new Date(),
            title: `ES ${i}`,
          },
          locale: spanishLocale,
        })
      }
    })

    it('should have correct totalDocs when unsorted', async () => {
      const simpleQuery = await payload.find({
        collection: localizedSortSlug,
      })
      const sortByIdQuery = await payload.find({
        collection: localizedSortSlug,
        sort: 'id',
      })

      expect(simpleQuery.totalDocs).toEqual(expectedTotalDocs)
      expect(sortByIdQuery.totalDocs).toEqual(expectedTotalDocs)
    })

    // https://github.com/payloadcms/payload/issues/4889
    it('should have correct totalDocs when sorted by localized fields', async () => {
      const sortByTitleQuery = await payload.find({
        collection: localizedSortSlug,
        sort: 'title',
      })
      const sortByDateQuery = await payload.find({
        collection: localizedSortSlug,
        sort: 'date',
      })

      expect(sortByTitleQuery.totalDocs).toEqual(expectedTotalDocs)
      expect(sortByDateQuery.totalDocs).toEqual(expectedTotalDocs)
    })
  })

  describe('Localized Relationship', () => {
    let localizedRelation: LocalizedPost
    let localizedRelation2: LocalizedPost
    let withRelationship: WithLocalizedRelationship

    beforeAll(async () => {
      localizedRelation = await createLocalizedPost({
        title: {
          [defaultLocale]: relationEnglishTitle,
          [spanishLocale]: relationSpanishTitle,
        },
      })
      localizedRelation2 = await createLocalizedPost({
        title: {
          [defaultLocale]: relationEnglishTitle2,
          [spanishLocale]: relationSpanishTitle2,
        },
      })

      // @ts-expect-error Force typing
      withRelationship = await payload.create({
        collection: withLocalizedRelSlug,
        data: {
          localizedRelationHasManyField: [localizedRelation.id, localizedRelation2.id],
          localizedRelationMultiRelationTo: {
            relationTo: localizedPostsSlug,
            value: localizedRelation.id,
          },
          localizedRelationMultiRelationToHasMany: [
            { relationTo: localizedPostsSlug, value: localizedRelation.id },
            { relationTo: localizedPostsSlug, value: localizedRelation2.id },
          ],
          localizedRelationship: localizedRelation.id,
        },
      })
    })

    describe('regular relationship', () => {
      it('can query localized relationship', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationship.title': {
              equals: localizedRelation.title,
            },
          },
        })

        expect(result.docs[0].id).toEqual(withRelationship.id)
      })

      it('specific locale', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationship.title': {
              equals: relationSpanishTitle,
            },
          },
        })

        expect(result.docs[0].id).toEqual(withRelationship.id)
      })

      it('all locales', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          locale: 'all',
          where: {
            'localizedRelationship.title.es': {
              equals: relationSpanishTitle,
            },
          },
        })

        expect(result.docs[0].id).toEqual(withRelationship.id)
      })

      it('populates relationships with all locales', async () => {
        // the relationship fields themselves are localized on this collection
        const result: any = await payload.find({
          collection: relationshipLocalizedSlug,
          depth: 1,
          locale: 'all',
        })

        expect(result.docs[0].relationship.en.id).toBeDefined()
        expect(result.docs[0].relationshipHasMany.en[0].id).toBeDefined()
        expect(result.docs[0].relationMultiRelationTo.en.value.id).toBeDefined()
        expect(result.docs[0].relationMultiRelationToHasMany.en[0].value.id).toBeDefined()
        expect(result.docs[0].arrayField.en[0].nestedRelation.id).toBeDefined()
      })
    })

    describe('relationship - hasMany', () => {
      it('default locale', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationHasManyField.title': {
              equals: localizedRelation.title,
            },
          },
        })

        expect(result.docs.map(({ id }) => id)).toContain(withRelationship.id)

        // Second relationship
        const result2 = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationHasManyField.title': {
              equals: localizedRelation2.title,
            },
          },
        })

        expect(result2.docs.map(({ id }) => id)).toContain(withRelationship.id)
      })

      it('specific locale', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationHasManyField.title': {
              equals: relationSpanishTitle,
            },
          },
        })

        expect(result.docs[0].id).toEqual(withRelationship.id)

        // Second relationship
        const result2 = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationHasManyField.title': {
              equals: relationSpanishTitle2,
            },
          },
        })

        expect(result2.docs[0].id).toEqual(withRelationship.id)
      })

      it('relationship population uses locale', async () => {
        const result = await payload.findByID({
          id: withRelationship.id,
          collection: withLocalizedRelSlug,
          depth: 1,
          locale: spanishLocale,
        })
        expect((result.localizedRelationship as LocalizedPost).title).toEqual(relationSpanishTitle)
      })

      it('all locales', async () => {
        const queryRelation = (where: Where) => {
          return payload.find({
            collection: withLocalizedRelSlug,
            locale: 'all',
            where,
          })
        }

        const result = await queryRelation({
          'localizedRelationHasManyField.title.en': {
            equals: relationEnglishTitle,
          },
        })

        expect(result.docs.map(({ id }) => id)).toContain(withRelationship.id)

        // First relationship - spanish
        const result2 = await queryRelation({
          'localizedRelationHasManyField.title.es': {
            equals: relationSpanishTitle,
          },
        })

        expect(result2.docs.map(({ id }) => id)).toContain(withRelationship.id)

        // Second relationship - english
        const result3 = await queryRelation({
          'localizedRelationHasManyField.title.en': {
            equals: relationEnglishTitle2,
          },
        })

        expect(result3.docs.map(({ id }) => id)).toContain(withRelationship.id)

        // Second relationship - spanish
        const result4 = await queryRelation({
          'localizedRelationHasManyField.title.es': {
            equals: relationSpanishTitle2,
          },
        })

        expect(result4.docs[0].id).toEqual(withRelationship.id)
      })
    })

    describe('relationTo multi', () => {
      it('by id', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationMultiRelationTo.value': {
              equals: localizedRelation.id,
            },
          },
        })

        expect(result.docs[0].id).toEqual(withRelationship.id)

        // Second relationship
        const result2 = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationMultiRelationTo.value': {
              equals: localizedRelation.id,
            },
          },
        })

        expect(result2.docs[0].id).toEqual(withRelationship.id)
      })
    })

    describe('relationTo multi hasMany', () => {
      it('by id', async () => {
        const result = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationMultiRelationToHasMany.value': {
              equals: localizedRelation.id,
            },
          },
        })

        expect(result.docs[0].id).toEqual(withRelationship.id)

        // First relationship - spanish locale
        const result2 = await payload.find({
          collection: withLocalizedRelSlug,
          locale: spanishLocale,
          where: {
            'localizedRelationMultiRelationToHasMany.value': {
              equals: localizedRelation.id,
            },
          },
        })

        expect(result2.docs[0].id).toEqual(withRelationship.id)

        // Second relationship
        const result3 = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationMultiRelationToHasMany.value': {
              equals: localizedRelation2.id,
            },
          },
        })

        expect(result3.docs[0].id).toEqual(withRelationship.id)

        // Second relationship - spanish locale
        const result4 = await payload.find({
          collection: withLocalizedRelSlug,
          where: {
            'localizedRelationMultiRelationToHasMany.value': {
              equals: localizedRelation2.id,
            },
          },
        })

        expect(result4.docs[0].id).toEqual(withRelationship.id)
      })
    })
  })

  describe('Localized - arrays with nested localized fields', () => {
    it('should allow moving rows and retain existing row locale data', async () => {
      const globalArray: any = await payload.findGlobal({
        slug: 'global-array',
      })

      const reversedArrayRows = [...globalArray.array].reverse()

      const updatedGlobal = await payload.updateGlobal({
        slug: 'global-array',
        data: {
          array: reversedArrayRows,
        },
        locale: 'all',
      })

      expect(updatedGlobal.array[0].text.en).toStrictEqual('test en 2')
      expect(updatedGlobal.array[0].text.es).toStrictEqual('test es 2')
    })
  })

  describe('Localized - required', () => {
    it('should update without passing all required fields', async () => {
      const newDoc = await payload.create({
        collection: withRequiredLocalizedFields,
        data: {
          layout: [
            {
              blockType: 'text',
              text: 'laiwejfilwaje',
            },
          ],
          title: 'hello',
        },
      })

      await payload.update({
        id: newDoc.id,
        collection: withRequiredLocalizedFields,
        data: {
          layout: [
            {
              blockType: 'number',
              number: 12,
            },
          ],
          title: 'en espanol, big bird',
        },
        locale: spanishLocale,
      })

      const updatedDoc = await payload.update({
        id: newDoc.id,
        collection: withRequiredLocalizedFields,
        data: {
          title: 'hello x2',
        },
      })

      expect(updatedDoc.layout[0].blockType).toStrictEqual('text')

      const spanishDoc = await payload.findByID({
        id: newDoc.id,
        collection: withRequiredLocalizedFields,
        locale: spanishLocale,
      })

      expect(spanishDoc.layout[0].blockType).toStrictEqual('number')
    })
  })

  describe('Localized - GraphQL', () => {
    let token
    let client

    it('should allow user to login and retrieve populated localized field', async () => {
      const query = `mutation {
        loginUser(email: "dev@payloadcms.com", password: "test") {
          token
          user {
            relation {
              title
            }
          }
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
          query: { locale: 'en' },
        })
        .then((res) => res.json())
      const result = data.loginUser

      expect(typeof result.token).toStrictEqual('string')
      expect(typeof result.user.relation.title).toStrictEqual('string')

      token = result.token
    })

    it('should allow retrieval of populated localized fields within meUser', async () => {
      const query = `query {
        meUser {
          user {
            id
            relation {
              title
            }
          }
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
          headers: {
            Authorization: `JWT ${token}`,
          },
          query: { locale: 'en' },
        })
        .then((res) => res.json())
      const result = data.meUser

      expect(typeof result.user.relation.title).toStrictEqual('string')
    })

    it('should create and update collections', async () => {
      const create = `mutation {
        createLocalizedPost(
          data: {
            title: "${englishTitle}"
          }
          locale: ${defaultLocale}
        ) {
          id
          title
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query: create }),
          headers: {
            Authorization: `JWT ${token}`,
          },
          query: { locale: 'en' },
        })
        .then((res) => res.json())
      const createResult = data.createLocalizedPost

      const update = `mutation {
        updateLocalizedPost(
          id: ${payload.db.defaultIDType === 'number' ? createResult.id : `"${createResult.id}"`},
          data: {
            title: "${spanishTitle}"
          }
          locale: ${spanishLocale}
        ) {
          title
        }
      }`

      const { data: updateData } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query: update }),
          headers: {
            Authorization: `JWT ${token}`,
          },
          query: { locale: 'en' },
        })
        .then((res) => res.json())
      const updateResult = updateData.updateLocalizedPost

      const result = await payload.findByID({
        id: createResult.id,
        collection: localizedPostsSlug,
        locale: 'all',
      })

      expect(createResult.title).toStrictEqual(englishTitle)
      expect(updateResult.title).toStrictEqual(spanishTitle)
      expect(result.title[defaultLocale]).toStrictEqual(englishTitle)
      expect(result.title[spanishLocale]).toStrictEqual(spanishTitle)
    })

    it('should query multiple locales', async () => {
      const englishDoc = await payload.create({
        collection: localizedPostsSlug,
        data: {
          title: englishTitle,
        },
        locale: defaultLocale,
      })
      const spanishDoc = await payload.create({
        collection: localizedPostsSlug,
        data: {
          title: spanishTitle,
        },
        locale: spanishLocale,
      })
      const query = `
      {
        es: LocalizedPost(id: ${idToString(spanishDoc.id, payload)}, locale: es) {
          title
        }
        en: LocalizedPost(id: ${idToString(englishDoc.id, payload)}, locale: en) {
          title
        }
      }
      `

      const { data: multipleLocaleData } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
          headers: {
            Authorization: `JWT ${token}`,
          },
          query: { locale: 'en' },
        })
        .then((res) => res.json())

      const { en, es } = multipleLocaleData

      expect(en.title).toStrictEqual(englishTitle)
      expect(es.title).toStrictEqual(spanishTitle)
    })
  })

  describe('Localized - Arrays', () => {
    let docID

    beforeAll(async () => {
      const englishDoc = await payload.create({
        collection: arrayCollectionSlug,
        data: {
          items: [
            {
              text: englishTitle,
            },
          ],
        },
      })

      docID = englishDoc.id
    })

    it('should use default locale as fallback', async () => {
      const spanishDoc = await payload.findByID({
        id: docID,
        collection: arrayCollectionSlug,
        locale: spanishLocale,
      })

      expect(spanishDoc.items[0].text).toStrictEqual(englishTitle)
    })

    it('should use empty array as value', async () => {
      const updatedSpanishDoc = await payload.update({
        id: docID,
        collection: arrayCollectionSlug,
        data: {
          items: [],
        },
        fallbackLocale: null,
        locale: spanishLocale,
      })

      expect(updatedSpanishDoc.items).toStrictEqual([])
    })

    it('should use fallback value if setting null', async () => {
      await payload.update({
        id: docID,
        collection: arrayCollectionSlug,
        data: {
          items: [],
        },
        locale: spanishLocale,
      })

      const updatedSpanishDoc = await payload.update({
        id: docID,
        collection: arrayCollectionSlug,
        data: {
          items: null,
        },
        locale: spanishLocale,
      })

      // should return the value of the fallback locale
      expect(updatedSpanishDoc.items[0].text).toStrictEqual(englishTitle)
    })
  })

  describe('Localized - Field Paths', () => {
    it('should allow querying by non-localized field names ending in a locale', async () => {
      await payload.update({
        id: post1.id,
        collection,
        data: {
          children: post1.id,
          group: {
            children: 'something',
          },
        },
      })

      const { docs: relationshipDocs } = await restClient
        .GET(`/${collection}`, {
          query: {
            where: {
              children: {
                in: post1.id,
              },
            },
          },
        })
        .then((res) => res.json())

      expect(relationshipDocs.map(({ id }) => id)).toContain(post1.id)

      const { docs: nestedFieldDocs } = await restClient
        .GET(`/${collection}`, {
          query: {
            where: {
              'group.children': {
                contains: 'some',
              },
            },
          },
        })
        .then((res) => res.json())

      expect(nestedFieldDocs.map(({ id }) => id)).toContain(post1.id)
    })
  })

  describe('Nested To Array And Block', () => {
    it('should be equal to the created document', async () => {
      const { id, blocks } = await payload.create({
        collection: nestedToArrayAndBlockCollectionSlug,
        data: {
          blocks: [
            {
              array: [
                {
                  text: 'english',
                  textNotLocalized: 'test',
                },
              ],
              blockType: 'block',
            },
          ],
        },
        locale: defaultLocale,
      })

      await payload.update({
        id,
        collection: nestedToArrayAndBlockCollectionSlug,
        data: {
          blocks: (blocks as { array: { text: string }[] }[]).map((block) => ({
            ...block,
            array: block.array.map((item) => ({ ...item, text: 'spanish' })),
          })),
        },
        locale: spanishLocale,
      })

      const docDefaultLocale = await payload.findByID({
        id,
        collection: nestedToArrayAndBlockCollectionSlug,
        locale: defaultLocale,
      })

      const docSpanishLocale = await payload.findByID({
        id,
        collection: nestedToArrayAndBlockCollectionSlug,
        locale: spanishLocale,
      })

      const rowDefault = docDefaultLocale.blocks[0].array[0]
      const rowSpanish = docSpanishLocale.blocks[0].array[0]

      expect(rowDefault.text).toEqual('english')
      expect(rowDefault.textNotLocalized).toEqual('test')
      expect(rowSpanish.text).toEqual('spanish')
      expect(rowSpanish.textNotLocalized).toEqual('test')
    })
  })

  describe('Duplicate Collection', () => {
    it('should duplicate localized document', async () => {
      const localizedPost = await payload.create({
        collection: localizedPostsSlug,
        data: {
          localizedCheckbox: true,
          title: englishTitle,
        },
        locale: defaultLocale,
      })

      const id = localizedPost.id.toString()

      await payload.update({
        id,
        collection: localizedPostsSlug,
        data: {
          localizedCheckbox: false,
          title: spanishTitle,
        },
        locale: spanishLocale,
      })

      const result = await payload.duplicate({
        id,
        collection: localizedPostsSlug,
        locale: defaultLocale,
      })

      const allLocales = await payload.findByID({
        id: result.id,
        collection: localizedPostsSlug,
        locale: 'all',
      })

      // check fields
      expect(result.title).toStrictEqual(englishTitle)

      expect(allLocales.title.es).toStrictEqual(spanishTitle)

      expect(allLocales.localizedCheckbox.en).toBeTruthy()
      expect(allLocales.localizedCheckbox.es).toBeFalsy()
    })
  })
})

async function createLocalizedPost(data: {
  title: {
    [defaultLocale]: string
    [spanishLocale]: string
  }
}): Promise<LocalizedPost> {
  const localizedRelation: any = await payload.create({
    collection,
    data: {
      title: data.title.en,
    },
  })

  await payload.update({
    id: localizedRelation.id,
    collection,
    data: {
      title: data.title.es,
    },
    locale: spanishLocale,
  })

  return localizedRelation
}
