/* eslint-env jest */

import toMarkdown from '../src/to-markdown'

it('converts HTML to markdown', () => {
  expect(toMarkdown('<h2>Hello</h2>')).toEqual('## Hello')
})

it('converts lists to a dash bullet style', () => {
  const html = `
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  `
  expect(toMarkdown(html)).toEqual('-   Item 1\n-   Item 2')
})

it("doesn't escape markdown", () => {
  const html = '<p>[Markdown](link)</p>'
  expect(toMarkdown(html)).toEqual('[Markdown](link)')
})
