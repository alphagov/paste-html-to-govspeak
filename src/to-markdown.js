import TurndownService from 'turndown'

const service = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-'
})

// As a user may have pasted markdown we rather crudley
// stop all escaping
service.escape = (string) => string

export default function toMarkdown (html) {
  return service.turndown(html)
}
