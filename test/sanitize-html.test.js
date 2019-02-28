/* eslint-env jest */

import sanitizeHtml from '../src/sanitize-html'

it('returns HTML as a string', () => {
  expect(sanitizeHtml('<h2>Hello</h2>')).toEqual('<h2>Hello</h2>')
})
