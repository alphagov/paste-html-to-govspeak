import TurndownService from 'turndown'

const service = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-'
})

// As a user may have pasted markdown we rather crudley
// stop all escaping
service.escape = (string) => string

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

export default function toGovspeak (html) {
  return service.turndown(html)
}
