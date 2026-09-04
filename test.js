import assert from 'node:assert'
import { findTemplate } from './server.js'

const list = [
  { templateId: 'welcome', templateLanguage: 'en' },
  { templateId: 'reschedule', templateLanguage: 'en' },
  { templateId: 'reschedule', templateLanguage: 'en_US' },
]
assert.deepEqual(findTemplate(list, 'welcome'), [list[0]])
// same templateId across languages returns both rows, not just the first
assert.equal(findTemplate(list, 'reschedule').length, 2)
assert.deepEqual(findTemplate(list, 'nope'), [])
console.log('ok')
