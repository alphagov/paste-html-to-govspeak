import sanitizeHtml from './sanitize-html'
import toMarkdown from './to-markdown'
import insertTextAtCursor from 'insert-text-at-cursor'

function pasteHtmlUsingHiddenElement (event) {
  let ieHiddenElement = event.target
  setTimeout(function () {
    let textarea = document.getElementById(ieHiddenElement.dataset.textarea)
    let html = ieHiddenElement.innerHTML
    insertTextAtCursor(textarea, toMarkdown(sanitizeHtml(html)))
    ieHiddenElement.innerHTML = ''
  }, 0)
}

function htmlFromPasteEvent (event) {
  if (window.clipboardData) { // IE11
    pasteHtmlUsingHiddenElement(event)
    return false
  } else if (event.clipboardData) { // Chrome, Edge, Firefox & Safari
    return event.clipboardData.getData('text/html')
  } else { // IE <11
    return false
  }
}

export default function pasteHtmlToGovspeak (event) {
  const element = event.target

  const html = htmlFromPasteEvent(event)

  if (html && html.length) {
    insertTextAtCursor(element, toMarkdown(sanitizeHtml(html)))
    event.preventDefault()
  }
}
