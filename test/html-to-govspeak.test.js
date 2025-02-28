/* eslint-env jest */

import htmlToGovspeak from '../src/html-to-govspeak'
import fs from 'fs'
import path from 'path'

function openFixture (fixturePath) {
  const filePath = path.join(__dirname, '__fixtures__', fixturePath)
  return fs.readFileSync(filePath, 'utf8')
}

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

it('converts h1 headers to h2', () => {
  expect(htmlToGovspeak('<h1>Hello</h1>')).toEqual('## Hello')
})

it('maintains headers from h2 to h6 headers', () => {
  expect(htmlToGovspeak('<h2>Hello</h2>')).toEqual('## Hello')
  expect(htmlToGovspeak('<h3>Hello</h3>')).toEqual('### Hello')
  expect(htmlToGovspeak('<h4>Hello</h4>')).toEqual('#### Hello')
  expect(htmlToGovspeak('<h5>Hello</h5>')).toEqual('##### Hello')
  expect(htmlToGovspeak('<h6>Hello</h6>')).toEqual('###### Hello')
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

it('removes title elements', () => {
  expect(htmlToGovspeak('<title>Title</title>')).toEqual('')
})

it('removes script elements', () => {
  expect(htmlToGovspeak('<script>alert("hi")</script>')).toEqual('')
})

it('removes noscript elements', () => {
  expect(htmlToGovspeak('<noscript>Enable JS</noscript>')).toEqual('')
})

it('removes style elements', () => {
  expect(htmlToGovspeak('<style>p {color:red;}</style>')).toEqual('')
})

it('removes video elements', () => {
  const html = `
    <video width="320" height="240" controls>
      <source src="movie.mp4" type="video/mp4">
      <source src="movie.ogg" type="video/ogg">
      Fallback text
    </video>
  `

  expect(htmlToGovspeak(html)).toEqual('')
})

it('removes audio elements', () => {
  const html = `
    <audio controls src="/media/examples/t-rex-roar.mp3">
      Fallback text
    </audio>
  `

  expect(htmlToGovspeak(html)).toEqual('')
})

it('removes object elements', () => {
  const html = `
    <object type="application/pdf"
      data="/media/examples/In-CC0.pdf"
      width="250"
      height="200">
      Fallback text
    </object>
  `

  expect(htmlToGovspeak(html)).toEqual('')
})

it('removes iframe elements', () => {
  const html = `
    <iframe src="./file">Fallback text</iframe>
  `

  expect(htmlToGovspeak(html)).toEqual('')
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

it('resolves duplicated whitespace inside an empty element', () => {
  const html = 'Some text <span> </span> and some more text'
  expect(htmlToGovspeak(html)).toEqual('Some text and some more text')
})

// The presence of elements preceeding text that is rendered can cause
// preceeding whitespace. Typically this is caused by elements in the <head>
// that are to be stripped out.
it('strips whitespace caused by surrounding, non-visual elements', () => {
  const html = `
    <meta charset="utf-8">
    <title>Title</title>
    <p>Some text</p>
  `
  expect(htmlToGovspeak(html)).toEqual('Some text')
})

it('removes MS Word comments', () => {
  const html = openFixture('ms-word-2016-comments.html')

  expect(htmlToGovspeak(html)).toEqual('A document with a comment')
})

it('Converts a MS Word unordered list to a markdown list', () => {
  const html = openFixture('ms-word-2016-unordered-list.html')

  expect(htmlToGovspeak(html)).toEqual(
    '- Item 1\n' +
    '- Item 2\n' +
    '- Item 3\n' +
    '- Item 4'
  )
})

it('Converts a MS Word ordered list to a markdown list', () => {
  const html = openFixture('ms-word-2016-ordered-list.html')

  expect(htmlToGovspeak(html)).toEqual(
    '1. Item 1\n' +
    '2. Item 2\n' +
    '3. Item 3\n' +
    '4. Item 4'
  )
})

it('Converts a MS Word nested list to a markdown list', () => {
  const html = openFixture('ms-word-2016-nested-list.html')

  expect(htmlToGovspeak(html)).toEqual(
    '1. Parent 1\n' +
    '   1. Parent 1 Child 1\n' +
    '      1. Parent 1 Child 1 Grandchild 1\n' +
    '      2. Parent 1 Child 1 Grandchild 2\n' +
    '      3. Parent 1 Child 1 Grandchild 3\n' +
    '   2. Parent 1 Child 2\n' +
    '2. Parent 2\n' +
    '   1. Parent 2 Child 1'
  )
})

it('Converts a MS Word list that uses msoNormal classes', () => {
  // simplified version of the HTML MS Word creates
  const html = `
    <p class="MsoNormal" style="mso-list:l0 level1 1fo1">
      <span>
        <span style="mso-list:Ignore">·</span>
        <span>Item 1</span>
      </span>
    </p>
    <p class="MsoNormal" style="mso-list:l0 level1 1fo1">
      <span>
        <span style="mso-list:Ignore">·</span>
        <span>Item 2</span>
      </span>
    </p>
  `

  expect(htmlToGovspeak(html)).toEqual(
    '- Item 1\n' +
    '- Item 2'
  )
})

it('Doesn\'t preserve markdown that is only a link with similar text to the link', () => {
  // If you paste the URL from the address bar of chrome this is the HTML created
  const html = `
    <meta charset='utf-8'><a href="https://alphagov.github.io/paste-html-to-govspeak/">https://alphagov.github.io/paste-html-to-govspeak/</a>
  `

  expect(htmlToGovspeak(html)).toEqual('https://alphagov.github.io/paste-html-to-govspeak/')
})

it('Copies email links in the preferred markdown style', () => {
  const html = `
    <p class="p1">Contact <a href="mailto:hello@example.com"><span class="s1">hello@example.com</span></a>.</p>
  `

  expect(htmlToGovspeak(html)).toEqual('Contact <hello@example.com>.')
})

it('Converts Google Docs tables to markdown', () => {
  const html = openFixture('google-docs-2023-table.html')

  expect(htmlToGovspeak(html)).toEqual(
    '| Header 1 | Header 2 | Header 3 |\n' +
    '| --- | --- | --- |\n' +
    '| A | B | C |\n' +
    '| D | E | F |'
  )
})
