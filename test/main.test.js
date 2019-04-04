/* eslint-env jest */

import { pasteListener } from '../src/main'

let mockLegacyHtmlFromPaste
let textarea

jest.mock('../src/legacy-html-from-paste.js', () => () => mockLegacyHtmlFromPaste)

beforeEach(() => {
  mockLegacyHtmlFromPaste = null

  textarea = document.createElement('textarea')
  textarea.addEventListener('paste', pasteListener)

  document.execCommand = jest.fn()
})

function createHtmlPasteEvent (html = null, text = null) {
  const event = new window.Event('paste')
  event.clipboardData = {
    getData: (type) => {
      if (type === 'text/html') {
        return html
      }
      if (type === 'text/plain') {
        return text
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

it("supports pasting in legacy browsers that don't have a clipboardData property", () => {
  mockLegacyHtmlFromPaste = '<h2>Hello</h2>'
  textarea.dispatchEvent(new window.Event('paste'))
  expect(textarea.value).toEqual('## Hello')
})

describe('htmlpaste event', () => {
  it('has raw HTML as the detail if HTML is pasted', () => {
    const listener = jest.fn()
    const html = '<script>alert("hi")</script>'

    textarea.addEventListener('htmlpaste', listener)
    textarea.dispatchEvent(createHtmlPasteEvent(html))

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: html
      })
    )
  })

  it('has null as the detail if no HTML is pasted', () => {
    const listener = jest.fn()

    textarea.addEventListener('htmlpaste', listener)
    textarea.dispatchEvent(createHtmlPasteEvent())

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: null
      })
    )
  })
})

describe('textpaste event', () => {
  it('has text as the detail if text is available is pasted', () => {
    const listener = jest.fn()
    const text = 'Hello'

    textarea.addEventListener('textpaste', listener)
    textarea.dispatchEvent(createHtmlPasteEvent('<h2>Hello</h2>', text))

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: text
      })
    )
  })

  it('has null as the detail if no text is pasted', () => {
    const listener = jest.fn()

    textarea.addEventListener('textpaste', listener)
    textarea.dispatchEvent(createHtmlPasteEvent())

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
