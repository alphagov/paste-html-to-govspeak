/* eslint-env jest */

import pasteHtmlToGovspeak from '../src/main'

let textarea

beforeEach(() => {
  textarea = document.createElement('textarea')
  textarea.addEventListener('paste', pasteHtmlToGovspeak)

  document.execCommand = jest.fn()
})

function createHtmlPasteEvent (html) {
  const event = new window.Event('paste')
  event.clipboardData = {
    getData: (type) => {
      if (type === 'text/html') {
        return html
      }
    }
  }

  return event
}

it("maintains browser default behaviour if HTML isn't pasted", () => {
  const event = new window.Event('paste')
  event.preventDefault = jest.fn()
  textarea.dispatchEvent(event)

  expect(event.preventDefault).not.toHaveBeenCalled()
})

it('converts HTML to govspeak if HTML is pasted', () => {
  textarea.dispatchEvent(createHtmlPasteEvent('<h2>Hello</h2>'))
  expect(textarea.value).toEqual('## Hello')
})

describe('htmlinput event', () => {
  it('has raw HTML as the detail if HTML is pasted', () => {
    const listener = jest.fn()
    const html = '<script>alert("hi")</script>'

    textarea.addEventListener('htmlinput', listener)
    textarea.dispatchEvent(createHtmlPasteEvent(html))

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: html
      })
    )
  })

  it('has null as the detail if no HTML is pasted', () => {
    const listener = jest.fn()

    textarea.addEventListener('htmlinput', listener)
    textarea.dispatchEvent(createHtmlPasteEvent(null))

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: null
      })
    )
  })
})

describe('govspeak event', () => {
  it('has govspeak as the event detail', () => {
    const listener = jest.fn()
    const html = '<h2>Title</h2>'

    textarea.addEventListener('govspeak', listener)
    textarea.dispatchEvent(createHtmlPasteEvent(html))

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: '## Title'
      })
    )
  })

  it("isn't called if no HTML is pasted", () => {
    const listener = jest.fn()

    textarea.addEventListener('govspeak', listener)
    textarea.dispatchEvent(createHtmlPasteEvent(null))

    expect(listener).not.toHaveBeenCalled()
  })
})
