/* eslint-env jest */

import legacyHtmlFromPaste from '../src/legacy-html-from-paste'

beforeEach(() => {
  window.clipboardData = {}
  window.clipboardData.setData = jest.fn()
})

it('returns the HTML entered by a paste exec command when clipboard access is enabled', () => {
  const html = '<p>Some text</p>'
  window.clipboardData.setData.mockReturnValue(true)

  document.execCommand = (type) => {
    if (type === 'paste') {
      // we expect a temporary element to exist at the point of pasting
      document.body.lastChild.innerHTML = html
    }
  }

  expect(legacyHtmlFromPaste()).toEqual(html)
  expect(document.body.lastChild).toBe(null)
})

it('returns the false when clipboard access is disabled', () => {
  const html = '<p>Some text</p>'
  window.clipboardData.setData.mockReturnValue(false)

  document.execCommand = (type) => {
    if (type === 'paste') {
      // we expect a temporary element to exist at the point of pasting
      document.body.lastChild.innerHTML = html
    }
  }

  expect(legacyHtmlFromPaste()).toEqual(false)
  expect(document.body.lastChild).toBe(null)
})
