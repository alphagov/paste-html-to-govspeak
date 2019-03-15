/* eslint-env jest */

import toGovspeak from '../src/to-govspeak'

it('converts HTML to govspeak', () => {
  expect(toGovspeak('<p>Hello</p>')).toEqual('Hello')
})

it("doesn't escape markdown", () => {
  const html = '<p>[Markdown](link)</p>'
  expect(toGovspeak(html)).toEqual('[Markdown](link)')
})

it('removes empty links', () => {
  expect(toGovspeak('<a href="https://www.gov.uk"><a>')).toEqual('')
})

it('ignores title attributes of links', () => {
  const html = '<a href="https://www.gov.uk" title="GOV.UK">www.gov.uk<a>'
  expect(toGovspeak(html)).toEqual('[www.gov.uk](https://www.gov.uk)')
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

it('maintains H2 and H3 headers', () => {
  expect(toGovspeak('<h2>Hello</h2>')).toEqual('## Hello')
  expect(toGovspeak('<h3>Hello</h3>')).toEqual('### Hello')
})

it('strips other headers', () => {
  expect(toGovspeak('<h1>Hello</h1>')).toEqual('Hello')
  expect(toGovspeak('<h4>Hello</h4>')).toEqual('Hello')
  expect(toGovspeak('<h5>Hello</h5>')).toEqual('Hello')
  expect(toGovspeak('<h6>Hello</h6>')).toEqual('Hello')
})

it('strips b and strong elements', () => {
  expect(toGovspeak('<p>With <b>bold</b> text</p>')).toEqual('With bold text')
  expect(toGovspeak('<p>With <strong>strong</strong> text</p>')).toEqual('With strong text')
})

it('strips i and em elements', () => {
  expect(toGovspeak('<p>With <i>italic</i> text</p>')).toEqual('With italic text')
  expect(toGovspeak('<p>With <em>emphasised</em> text</p>')).toEqual('With emphasised text')
})

it('removes image elements', () => {
  expect(toGovspeak('<img src="image.jpg" alt="" />')).toEqual('')
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

it('removes empty paragraphs', () => {
  const html = `
    <p>Not empty</p>
    <p><br /></p>
    <p>  </p>
    <p>  <br />  </p>
    <p>Not empty either</p>
  `
  expect(toGovspeak(html)).toEqual(
    'Not empty\n\nNot empty either'
  )
})
