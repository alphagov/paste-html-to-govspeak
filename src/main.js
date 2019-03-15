import sanitiseHtml from './sanitise-html'
import toGovspeak from './to-govspeak'
import htmlFromHiddenElement from './html-from-hidden-element'
import insertTextAtCursor from 'insert-text-at-cursor'

function htmlFromPasteEvent (event) {
  if (event.clipboardData) {
    return event.clipboardData.getData('text/html')
  } else if (window.clipboardData) {
    return htmlFromHiddenElement()
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
  triggerPasteEvent(element, 'htmlinput', html)

  if (html && html.length) {
    const sanitised = sanitiseHtml(html)
    triggerPasteEvent(element, 'sanitise', sanitised)

    const govspeak = toGovspeak(sanitised)
    triggerPasteEvent(element, 'govspeak', govspeak)

    insertTextAtCursor(element, govspeak)
    event.preventDefault()
  }
}
