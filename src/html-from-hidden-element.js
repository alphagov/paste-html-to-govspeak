// This file provides a technique to maintain html that is pasted in IE
// despite the lack of support for clipboardData.getData('text/html').
// This uses a technique of creating a hidden element and pasting into that.
// Then acessing the innerHTML of it before finally removing it. This approach
// is explained more thoroughly in: https://www.lucidchart.com/techblog/2014/12/02/definitive-guide-copying-pasting-javascript/
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
