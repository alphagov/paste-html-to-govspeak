/* eslint-env jest */

import htmlFromHiddenElement from '../src/html-from-hidden-element'

it('returns the HTML entered by a paste exec command', () => {
  const html = '<p>Some text</p>'

  document.execCommand = (type) => {
    if (type === 'paste') {
      // we expect a temporary element to exist at the point of pasting
      document.body.lastChild.innerHTML = html
    }
  }

  expect(htmlFromHiddenElement()).toEqual(html)
  expect(document.body.lastChild).toBe(null)
})
