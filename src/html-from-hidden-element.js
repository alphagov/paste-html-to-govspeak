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

function getHtmlUsingHiddenElement (ieHiddenElement) {
  ieHiddenElement.focus()
  document.execCommand('paste')
  return ieHiddenElement.innerHTML
}

export default function htmlFromHiddenElement () {
  const ieHiddenElement = createHiddenElement()
  const html = getHtmlUsingHiddenElement(ieHiddenElement)
  removeElement(ieHiddenElement)
  return html
}
