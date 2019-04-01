import TurndownService from 'turndown'

const service = new TurndownService({
  bulletListMarker: '-'
})

// As a user may have pasted markdown we rather crudley
// stop all escaping
service.escape = (string) => string

// turndown keeps title attribute attributes of links by default which isn't
// what is expected in govspeak
service.addRule('link', {
  filter: (node) => {
    return node.nodeName.toLowerCase() === 'a' && node.getAttribute('href')
  },
  replacement: (content, node) => {
    if (content.trim() === '') {
      return ''
    } else {
      return `[${content}](${node.getAttribute('href')})`
    }
  }
})

service.addRule('abbr', {
  filter: (node) => {
    return node.nodeName.toLowerCase() === 'abbr' && node.getAttribute('title')
  },
  replacement: function (content, node) {
    this.references[content] = node.getAttribute('title')
    return content
  },
  references: {},
  append: function () {
    if (Object.keys(this.references).length === 0) {
      return ''
    }

    let references = '\n\n'
    for (const abbr in this.references) {
      references += `*[${abbr}]: ${this.references[abbr]}\n`
    }
    this.references = {} // reset after appending
    return references
  }
})

// Create a govspeak heading rule
service.addRule('heading', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  replacement: (content, node) => {
    let prefix
    if (node.nodeName.charAt(1) === '2') {
      prefix = '## '
    } else if (node.nodeName.charAt(1) === '3') {
      prefix = '### '
    } else {
      prefix = ''
    }

    return `\n\n${prefix}${content}\n\n`
  }
})

// remove bold
service.addRule('bold', {
  filter: ['b', 'strong'],
  replacement: (content) => content
})

// remove italic
service.addRule('italic', {
  filter: ['i', 'em'],
  replacement: (content) => content
})

// remove images
service.addRule('img', {
  filter: ['img'],
  replacement: () => ''
})

service.addRule('removeEmptyParagraphs', {
  filter: (node) => {
    return node.nodeName.toLowerCase() === 'p' && node.textContent.trim() === ''
  },
  replacement: () => ''
})

// remove style elements
service.addRule('style', {
  filter: ['style'],
  replacement: () => ''
})

// strip paragraph elements within list items
service.addRule('stripParagraphsInListItems', {
  filter: (node) => {
    return node.nodeName.toLowerCase() === 'p' && node.parentNode.nodeName.toLowerCase() === 'li'
  },
  replacement: (content) => content
})

function removeBrParagraphs (govspeak) {
  // This finds places where we have a br in a paragraph on it's own and
  // removes it.
  //
  // E.g. if we have HTML of <b><p>Text</p><br><p>More text</p></b> (as google
  // docs can easily produce) which produces govspeak of
  // "Text\n\n  \n\nMore Text". This regexp can strip this back to be
  // Text\n\nMore Text
  const regExp = new RegExp(`\n(${service.options.br}\n)+\n?`, 'g')
  return govspeak.replace(regExp, '\n')
}

function postProcess (govspeak) {
  return removeBrParagraphs(govspeak)
}

export default function toGovspeak (html) {
  const govspeak = service.turndown(html)
  return postProcess(govspeak)
}
