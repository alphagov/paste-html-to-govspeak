import toGovspeak from './to-govspeak'
import insertTextAtCursor from 'insert-text-at-cursor'
import htmlFromHiddenElement from './html-from-hidden-element'

function htmlFromPasteEvent (event) {
  // Modern browsers
  if (event.clipboardData) {
    return event.clipboardData.getData('text/html')
  } else if (window.clipboardData) { // IE proprietary property
    // As IE doesn't support event.clipboardData we have to use a hack to
    // access HTML from a paste
    return htmlFromHiddenElement()
  }
}

function textFromPasteEvent (event) {
  if (event.clipboardData) {
    return event.clipboardData.getData('text/plain')
  } else if (window.clipboardData) {
    return window.clipboardData.getData('Text')
  }
}

function triggerPasteEvent (element, eventName, detail) {
  let params = { bubbles: false, cancelable: false, detail: detail || null }
  let event

  if (typeof window.CustomEvent === 'function') {
    event = new window.CustomEvent(eventName, params)
  } else {
    event = document.createEvent('CustomEvent')
    event.initCustomEvent(eventName, params.bubbles, params.cancelable, params.detail)
  }

  element.dispatchEvent(event)
}

export default function pasteHtmlToGovspeak (event) {
  const element = event.target

  const html = htmlFromPasteEvent(event)
  triggerPasteEvent(element, 'htmlpaste', html)

  const text = textFromPasteEvent(event)
  triggerPasteEvent(element, 'textpaste', text)

  if (html && html.length) {
    const govspeak = toGovspeak(html)
    triggerPasteEvent(element, 'govspeak', govspeak)

    insertTextAtCursor(element, govspeak)
    event.preventDefault()
  }
}
