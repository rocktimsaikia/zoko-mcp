import assert from 'node:assert'
import { findTemplate } from './server.js'

const list = [
  { templateId: 'abc', templateName: 'welcome' },
  { id: 'xyz', name: 'reminder' },
]
assert.equal(findTemplate(list, 'welcome').templateId, 'abc')
assert.equal(findTemplate(list, 'xyz').name, 'reminder')
assert.equal(findTemplate(list, 'nope'), undefined)
console.log('ok')
