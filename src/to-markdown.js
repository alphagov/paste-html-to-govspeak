import TurndownService from 'turndown'

export default function toMarkdown (html) {
  const service = new TurndownService()
  return service.turndown(html)
}
