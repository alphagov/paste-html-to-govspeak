/* eslint-env jest */

import toMarkdown from '../src/to-markdown'

it('converts HTML to markdown', () => {
  expect(toMarkdown('<h2>Hello</h2>')).toEqual('## Hello')
})
