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
    return node.nodeName.toLowerCase() === 'p' &&
      node.parentNode.nodeName.toLowerCase() === 'li'
  },
  replacement: (content) => content
})

service.addRule('cleanUpNestedLinks', {
  filter: (node) => {
    if (node.nodeName.toLowerCase() === 'a' && node.previousSibling) {
      return node.previousSibling.textContent.match(/\]\($/)
    }
  },
  replacement: (content, node) => {
    return node.getAttribute('href')
  }
})

// Google docs has a habit of producing nested lists that are not nested
// with valid HTML. Rather than embedding sub lists inside an <li> element they
// are nested in the <ul> or <ol> element.
service.addRule('invalidNestedLists', {
  filter: (node) => {
    const nodeName = node.nodeName.toLowerCase()
    if ((nodeName === 'ul' || nodeName === 'ol') && node.previousElementSibling) {
      const previousNodeName = node.previousElementSibling.nodeName.toLowerCase()
      return previousNodeName === 'li'
    }
  },
  replacement: (content, node) => {
    content = content
      .replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '') // replace trailing newlines
      .replace(/\n/gm, '\n    ') // indent

    return '    ' + content + '\n'
  }
})

// This is ported from https://github.com/domchristie/turndown/blob/80297cebeae4b35c8d299b1741b383c74eddc7c1/src/commonmark-rules.js#L61-L80
// It is modified to handle items from the invalidNestedLists as if these
// are ordered lists they will be output with incorrect numbering.
service.addRule('listItems', {
  filter: 'li',
  replacement: function (content, node, options) {
    content = content
      .replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
      .replace(/\n/gm, '\n    ') // indent

    let prefix = options.bulletListMarker + '   '
    const parent = node.parentNode
    if (parent.nodeName.toLowerCase() === 'ol') {
      const start = parent.getAttribute('start')
      const listItems = Array.prototype.filter.call(
        parent.children, (element) => element.nodeName.toLowerCase() === 'li'
      )
      const index = Array.prototype.indexOf.call(listItems, node)
      prefix = (start ? Number(start) + index : index + 1) + '.  '
    }
    return (
      prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
    )
  }
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

function extractHeadingsFromLists (govspeak) {
  // This finds instances of headings within ordered lists and replaces them
  // with the headings only. This only applies to H2 and H3.
  const headingsInListsRegExp = new RegExp(/\d\.\s{2}(#{2,3})/, 'g')
  return govspeak.replace(headingsInListsRegExp, '$1')
}

function postProcess (govspeak) {
  let govspeakWithExtractedHeadings = extractHeadingsFromLists(govspeak)
  return removeBrParagraphs(govspeakWithExtractedHeadings)
}

export default function toGovspeak (html) {
  const govspeak = service.turndown(html)
  return postProcess(govspeak)
}
