/* eslint-env jest */

import sanitiseHtml from '../src/sanitise-html'

it('returns HTML as a string', () => {
  expect(sanitiseHtml('<h2>Hello</h2>')).toEqual('<h2>Hello</h2>')
})

it('maintains text from HTML that is removed', () => {
  expect(sanitiseHtml('<h1>Hello</h1>')).toEqual('Hello')
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
  expect(sanitiseHtml(titleHtml).trim()).toEqual('Text')

  expect(sanitiseHtml('<script>var = {}</script>')).toEqual('')

  expect(sanitiseHtml('<style> a { color: purple } </style>')).toEqual('')
})

it('maintains href attributes in a tags', () => {
  const html = '<a href="/path" title="my link">link</a>'
  expect(sanitiseHtml(html)).toEqual('<a href="/path">link</a>')
})

it('maintains title attributes in a abbr', () => {
  const html = '<abbr title="Abbreviation" style="display: none">abbr</abbr>'
  expect(sanitiseHtml(html)).toEqual('<abbr title="Abbreviation">abbr</abbr>')
})

it('removes empty paragraphs', () => {
  expect(sanitiseHtml('<p></p>')).toEqual('')
  expect(sanitiseHtml('<p><br /></p>')).toEqual('')
  expect(sanitiseHtml('<p> </p>')).toEqual('')
  expect(sanitiseHtml('<p> <br /> </p>')).toEqual('')
})
