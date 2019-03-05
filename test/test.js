/* eslint-env mocha */
/* global assert */

describe('paste-html-to-govspeak', function () {
  describe('sanitize-html', function () {
    it('returns HTML as a string', () => {
      assert.equal(window.sanitizeHtml('<h2>Hello</h2>'), '<h2>Hello</h2>')
    })
  })

  describe('to-markdown', function () {
    it('converts HTML to markdown', () => {
      assert.equal(window.toMarkdown('<h2>Hello</h2>'), '## Hello')
    })
  })
})
