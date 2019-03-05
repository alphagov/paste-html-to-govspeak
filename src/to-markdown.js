import TurndownService from 'turndown'

export default function toMarkdown (html) {
  const service = new TurndownService({ headingStyle: 'atx' })
  return service.turndown(html)
}
