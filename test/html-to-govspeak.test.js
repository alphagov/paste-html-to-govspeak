/* eslint-env jest */

import htmlToGovspeak from '../src/html-to-govspeak'

it('converts HTML to govspeak', () => {
  expect(htmlToGovspeak('<p>Hello</p>')).toEqual('Hello')
})
it("doesn't escape markdown", () => {
  const html = '<p>[Markdown](link)</p>'
  expect(htmlToGovspeak(html)).toEqual('[Markdown](link)')
})

it('removes empty links', () => {
  expect(htmlToGovspeak('<a href="https://www.gov.uk"><a>')).toEqual('')
})

it('ignores title attributes of links', () => {
  const html = '<a href="https://www.gov.uk" title="GOV.UK">www.gov.uk<a>'
  expect(htmlToGovspeak(html)).toEqual('[www.gov.uk](https://www.gov.uk)')
})

it('converts lists to a dash bullet style', () => {
  const html = `
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  `
  expect(htmlToGovspeak(html)).toEqual('- Item 1\n- Item 2')
})

it('maintains H2 and H3 headers', () => {
  expect(htmlToGovspeak('<h2>Hello</h2>')).toEqual('## Hello')
  expect(htmlToGovspeak('<h3>Hello</h3>')).toEqual('### Hello')
})

it('strips other headers', () => {
  expect(htmlToGovspeak('<h1>Hello</h1>')).toEqual('Hello')
  expect(htmlToGovspeak('<h4>Hello</h4>')).toEqual('Hello')
  expect(htmlToGovspeak('<h5>Hello</h5>')).toEqual('Hello')
  expect(htmlToGovspeak('<h6>Hello</h6>')).toEqual('Hello')
})

it('strips b and strong elements', () => {
  expect(htmlToGovspeak('<p>With <b>bold</b> text</p>')).toEqual('With bold text')
  expect(htmlToGovspeak('<p>With <strong>strong</strong> text</p>')).toEqual('With strong text')
})

it('strips i and em elements', () => {
  expect(htmlToGovspeak('<p>With <i>italic</i> text</p>')).toEqual('With italic text')
  expect(htmlToGovspeak('<p>With <em>emphasised</em> text</p>')).toEqual('With emphasised text')
})

it('removes image elements', () => {
  expect(htmlToGovspeak('<img src="image.jpg" alt="" />')).toEqual('')
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

  expect(htmlToGovspeak(html)).toEqual(
    'Documents on the web are wrote using HTML and styled with CSS. These ' +
    'are both examples of web standards.\n\n' +
    '*[HTML]: Hypertext Markup Language\n' +
    '*[CSS]: Cascading Style Sheets'
  )
})

it('removes empty paragraphs', () => {
  const html = `
    <p>Not empty</p>
    <p><br /></p>
    <p>  </p>
    <p>  <br />  </p>
    <p>Not empty either</p>
  `
  expect(htmlToGovspeak(html)).toEqual(
    'Not empty\n\nNot empty either'
  )
})

it('removes rogue br elements', () => {
  const html = `
    <p>Not empty</p>
    <br>
    <span><br></span>
    <p>Not empty either</p>
  `
  expect(htmlToGovspeak(html)).toEqual(
    'Not empty\n\nNot empty either'
  )
})

it('removes style elements', () => {
  expect(htmlToGovspeak(`<style>p {color:red;}</style>`)).toEqual('')
})

it('extracts headers from lists', () => {
  const html = `
    <ol>
      <li><h2>Item 1</h2></li>
      <li><h3>Item 2</h3></li>
    </ol>
  `
  expect(htmlToGovspeak(html)).toEqual('## Item 1\n   \n### Item 2')
})

it('strips paragraph elements within a list item', () => {
  const html = `
    <ul>
      <li><p>Item 1</p></li>
      <li><p>Item 2</p></li>
    </ul>
  `
  expect(htmlToGovspeak(html)).toEqual('- Item 1\n- Item 2')
})

it('removes nested links when link markdown text is wrapped in an element', () => {
  const html = `
    <span>[nested link](</span><a href="https://www.gov.uk/">https://www.gov.uk/</a>)
  `
  expect(htmlToGovspeak(html)).toEqual('[nested link](https://www.gov.uk/)')
})

it('removes nested links when link markdown text is not wrapped in an element', () => {
  const html = `
    [nested link](<a href="https://www.gov.uk/">https://www.gov.uk/</a>)
  `
  expect(htmlToGovspeak(html)).toEqual('[nested link](https://www.gov.uk/)')
})

it('fixes an invalid nested unordered list that Google Docs produces', () => {
  const html = `
    <ul>
      <li>Parent</li>
      <ul>
        <li>Child</li>
        <ul>
          <li>Grand child</li>
        </ul>
      </ul>
      <li>Parent sibling</li>
    </ul>
  `
  expect(htmlToGovspeak(html)).toEqual(
    '- Parent\n' +
    '   - Child\n' +
    '      - Grand child\n' +
    '- Parent sibling'
  )
})

it('fixes an invalid nested ordered list that Google Docs produces', () => {
  const html = `
    <ol>
      <li>Parent</li>
      <ol>
        <li>Child 1</li>
        <ol>
          <li>Grand child 1</li>
          <li>Grand child 2</li>
        </ol>
        <li>Child 2</li>
        <li>Child 3</li>
      </ol>
      <li>Parent sibling</li>
    </ol>
  `
  expect(htmlToGovspeak(html)).toEqual(
    '1. Parent\n' +
    '   1. Child 1\n' +
    '      1. Grand child 1\n' +
    '      2. Grand child 2\n' +
    '   2. Child 2\n' +
    '   3. Child 3\n' +
    '2. Parent sibling'
  )
})

it('Fixes cases where a <span>&nbsp;</span> has the space stripped', () => {
  const html = `Some text<span>&nbsp;</span>and some more text`

  expect(htmlToGovspeak(html)).toEqual('Some text and some more text')
})

// This test is here to document an undesirable case that took a lot of
// investigation. This should be resolved when/if https://github.com/domchristie/turndown/pull/281
// is released.
it('Maintains behaviour where a <span> </span> produces a double space', () => {
  const html = `Some text<span> </span>and some more text`

  expect(htmlToGovspeak(html)).toEqual('Some text  and some more text')
})
