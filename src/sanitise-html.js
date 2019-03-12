import domPurify from 'dompurify'

const allowedElements = {
  a: ['href'],
  abbr: ['title'],
  blockquote: [],
  br: [],
  cite: [],
  h2: [],
  h3: [],
  li: [],
  ol: [],
  p: [],
  ul: []
}

domPurify.addHook('uponSanitizeElement', (node, data) => {
  if (node.nodeName.toLowerCase() === 'p' && node.textContent.trim() === '') {
    node.parentNode.removeChild(node)
  }
})

domPurify.addHook('uponSanitizeAttribute', (node, data) => {
  const elementName = node.nodeName.toLowerCase()

  if (allowedElements[elementName]) {
    data.keepAttr = allowedElements[elementName].indexOf(data.attrName) !== -1
  } else {
    data.keepAttr = false
  }
})

export default function sanitiseHtml (html) {
  return domPurify.sanitize(html, {
    ALLOWED_TAGS: Object.keys(allowedElements),
    KEEP_CONTENT: true
  })
}
