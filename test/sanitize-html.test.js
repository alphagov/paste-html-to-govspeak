/* eslint-env jest */

import sanitizeHtml from '../src/sanitize-html'

it('returns HTML as a string', () => {
  expect(sanitizeHtml('<h2>Hello</h2>')).toEqual('<h2>Hello</h2>')
})

it('maintains text from HTML that is removed', () => {
  expect(sanitizeHtml('<h1>Hello</h1>')).toEqual('Hello')
})

it('removes non-visible element content', () => {
  const titleHtml = `
    <html>
      <head>
        <title>Title</title>
      </head>
      <body>
        Text
      </body>
    </html>
  `
  expect(sanitizeHtml(titleHtml).trim()).toEqual('Text')

  expect(sanitizeHtml('<script>var = {}</script>')).toEqual('')

  expect(sanitizeHtml('<style> a { color: purple } </style>')).toEqual('')
})

it('maintains href attributes in a tags', () => {
  const html = '<a href="/path" title="my link">link</a>'
  expect(sanitizeHtml(html)).toEqual('<a href="/path">link</a>')
})

it('maintains title attributes in a abbr', () => {
  const html = '<abbr title="Abbreviation" style="display: none">abbr</abbr>'
  expect(sanitizeHtml(html)).toEqual('<abbr title="Abbreviation">abbr</abbr>')
})

it('removes empty paragraphs', () => {
  expect(sanitizeHtml('<p></p>')).toEqual('')
  expect(sanitizeHtml('<p><br /></p>')).toEqual('')
  expect(sanitizeHtml('<p> </p>')).toEqual('')
  expect(sanitizeHtml('<p> <br /> </p>')).toEqual('')
})
