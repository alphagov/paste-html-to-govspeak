import sanitizeHtml from './sanitize-html'
import toMarkdown from './to-markdown'
import insertTextAtCursor from 'insert-text-at-cursor'

function createHiddenElement () {
  let ieHiddenElement = document.createElement('div')
  ieHiddenElement.setAttribute('contenteditable', true)
  ieHiddenElement.setAttribute('style', 'position: absolute; top:0; left: 0; opacity: 0;')
  document.body.appendChild(ieHiddenElement)
  return ieHiddenElement
}

function removeElement (node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node)
  }
}

function getHtmlUsingHiddenElement () {
  let ieHiddenElement = createHiddenElement()
  ieHiddenElement.focus()
  document.execCommand('paste')

  let html = ieHiddenElement.innerHTML
  removeElement(ieHiddenElement)

  return html
}

function htmlFromPasteEvent (event) {
  if (window.clipboardData) { // IE11
    return getHtmlUsingHiddenElement()
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
