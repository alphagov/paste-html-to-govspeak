import sanitizeHtml from './sanitize-html'
import toMarkdown from './to-markdown'
import insertTextAtCursor from 'insert-text-at-cursor'

function htmlFromPasteEvent (event) {
  if (!event.clipboardData) {
    return
  }
  return event.clipboardData.getData('text/html')
}

function pasteHtmlToMarkdown (event) {
  const element = event.target

  const html = htmlFromPasteEvent(event)

  if (html && html.length) {
    insertTextAtCursor(element, toMarkdown(sanitizeHtml(html)))
    event.preventDefault()
  }
}

window.pasteHtmlToMarkdown = pasteHtmlToMarkdown
window.sanitizeHtml = sanitizeHtml
window.toMarkdown = toMarkdown

export { pasteHtmlToMarkdown }
