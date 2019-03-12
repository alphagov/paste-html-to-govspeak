/* eslint-env jest */

import pasteHtmlToGovspeak from '../src/main'

it("maintains browser default behaviour if HTML isn't pasted", () => {
  const textarea = document.createElement('textarea')
  textarea.addEventListener('paste', pasteHtmlToGovspeak)

  const event = new window.Event('paste')
  event.preventDefault = jest.fn()
  textarea.dispatchEvent(event)

  expect(event.preventDefault).not.toHaveBeenCalled()
})

it('converts HTML to govspeak if HTML is pasted', () => {
  const textarea = document.createElement('textarea')
  textarea.addEventListener('paste', pasteHtmlToGovspeak)

  const event = new window.Event('paste')
  event.clipboardData = {
    getData: (type) => {
      if (type === 'text/html') {
        return '<h2>Hello</h2>'
      }
    }
  }

  document.execCommand = jest.fn()

  textarea.dispatchEvent(event)
  expect(textarea.value).toEqual('## Hello')
})
