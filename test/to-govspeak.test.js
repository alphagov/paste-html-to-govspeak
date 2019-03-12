/* eslint-env jest */

import toGovspeak from '../src/to-govspeak'

it('converts HTML to govspeak', () => {
  expect(toGovspeak('<h2>Hello</h2>')).toEqual('## Hello')
})

it('converts lists to a dash bullet style', () => {
  const html = `
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  `
  expect(toGovspeak(html)).toEqual('-   Item 1\n-   Item 2')
})

it("doesn't escape markdown", () => {
  const html = '<p>[Markdown](link)</p>'
  expect(toGovspeak(html)).toEqual('[Markdown](link)')
})

it('converts abbr elements to references', () => {
  const html = `
    <p>
      Documents on the web are wrote using
      <abbr title="Hypertext Markup Language">HTML</abbr> and styled with
      <abbr title="Cascading Style Sheets">CSS</abbr>. These are both examples
      of web standards.
    <p>
  `

  expect(toGovspeak(html)).toEqual(
    'Documents on the web are wrote using HTML and styled with CSS. These ' +
    'are both examples of web standards.\n\n' +
    '*[HTML]: Hypertext Markup Language\n' +
    '*[CSS]: Cascading Style Sheets'
  )
})
