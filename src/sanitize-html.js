import domPurify from 'dompurify'

export default function sanitizeHtml (html) {
  return domPurify.sanitize(html)
}
