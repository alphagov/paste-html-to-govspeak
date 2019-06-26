// This file provides a technique to maintain html that is pasted in legacy
// browsers, such as Internet Explorer that lack support for
// clipboardData.getData('text/html') on a paste event.
// This involves creating a hidden element, pasting into that, acessing the
// innerHTML of that element before finally removing it.
// This approach is explained more thoroughly in: https://www.lucidchart.com/techblog/2014/12/02/definitive-guide-copying-pasting-javascript/
function createHiddenElement () {
  let hiddenElement = document.createElement('div')
  hiddenElement.setAttribute('contenteditable', true)
  hiddenElement.setAttribute('style', 'position: absolute; top:0; left: 0; opacity: 0;')
  document.body.appendChild(hiddenElement)
  return hiddenElement
}

function removeElement (node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node)
  }
}

function getHtmlUsingHiddenElement (hiddenElement) {
  hiddenElement.focus()
  document.execCommand('paste')
  return hiddenElement.innerHTML
}

// Check for write access to clipboard, otherwise we're not allowed by the browser to paste in a contenteditable container
function haveClipboardAccess () {
  return window.clipboardData && window.clipboardData.setData('Text', '')
}

export default function legacyHtmlFromPaste () {
  if (!haveClipboardAccess()) {
    return false
  }
  const hiddenElement = createHiddenElement()
  const html = getHtmlUsingHiddenElement(hiddenElement)
  removeElement(hiddenElement)
  return html
}
