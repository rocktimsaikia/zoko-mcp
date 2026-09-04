import assert from 'node:assert'
import { findTemplate, getWebhook } from './server.js'

// the last case asserts the missing-key path, so a real key in the env must not leak in
delete process.env.ZOKO_API_KEY

const list = [
  { templateId: 'welcome', templateLanguage: 'en' },
  { templateId: 'reschedule', templateLanguage: 'en' },
  { templateId: 'reschedule', templateLanguage: 'en_US' },
]
assert.deepEqual(findTemplate(list, 'welcome'), [list[0]])
// same templateId across languages returns both rows, not just the first
assert.equal(findTemplate(list, 'reschedule').length, 2)
assert.deepEqual(findTemplate(list, 'nope'), [])

// Stub fetch so the retry logic is checked without touching the network.
let calls
const stubFetch = (...responses) => {
  calls = []
  globalThis.fetch = async (url) => {
    calls.push(url)
    const next = responses[calls.length - 1]
    if (next instanceof Error) throw next
    return next
  }
}
const ok = (body) => ({ ok: true, json: async () => body })
const truncated = () => ({
  ok: true,
  json: async () => {
    throw new SyntaxError('Unexpected end of JSON input')
  },
})
const notFound = () => ({ ok: false, status: 404, text: async () => '{"message":"Webhook not found"}' })

stubFetch(ok({ id: 'a' }))
assert.deepEqual(await getWebhook('a', 'key'), { id: 'a' })
assert.equal(calls.length, 1)
assert.match(calls[0], /\/webhook\/a$/)

// A dropped body is retried
stubFetch(truncated(), ok({ id: 'b' }))
assert.deepEqual(await getWebhook('b', 'key'), { id: 'b' })
assert.equal(calls.length, 2)

// A dropped connection is retried
stubFetch(new TypeError('terminated'), ok({ id: 'c' }))
assert.deepEqual(await getWebhook('c', 'key'), { id: 'c' })
assert.equal(calls.length, 2)

// A 404 is the answer, not a blip - one call, no retry
stubFetch(notFound(), ok({ id: 'never' }))
await assert.rejects(getWebhook('nope', 'key'), /Zoko 404/)
assert.equal(calls.length, 1)

// ids are escaped into the path
stubFetch(ok({}))
await getWebhook('a/b?c', 'key')
assert.match(calls[0], /\/webhook\/a%2Fb%3Fc$/)

// missing key fails before any request
stubFetch(ok({}))
await assert.rejects(getWebhook('a', undefined), /ZOKO_API_KEY not set/)
assert.equal(calls.length, 0)

console.log('ok')
