# Changelog

- We use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
- Mark breaking changes with `BREAKING:`. Be sure to include instructions on
  how applications should be upgraded.
- Include a link to your pull request.
- Don't include changes that are purely internal. The CHANGELOG should be a
  useful summary for people upgrading their application, not a replication
  of the commit log.

## 0.5.0

- Make email links use the recommended markdown style

## 0.4.0

- Add table plugin for handling tables
- Update dependencies

## 0.3.0

- Maintain heading level from H2 to H6 (PR #235)

## 0.2.6

- Reduce unnecessary files from node module

## 0.2.5

- Bump dependencies

## 0.2.4

- Bump dependencies to resolve security issues

## 0.2.3

- Fix error when pasting content at the end of the textarea in IE11 by updating insert-text-at-cursor to 0.3.0 (PR #53)
- Fix paste action when access to clipboard is disabled in IE11 (PR #52)

## 0.2.2

- Strip links that match URL and are the only content of a paste document (PR #48)

## 0.2.1

- Widen MS word list support (PR #46)

## 0.2.0

- Convert MS Word lists to markdown lists (PR #42)
- Convert h1 headers to h2, convert h4 and h5 headers to h3 (PR #41)
- Remove comments produced by MS Word 2016 (PR #40)
- Fix dist file containing ES2015 and regex breaking in IE11 (PR #39)
- Remove more undesirable elements and trim output whitespace (PR #38)

## 0.1.1

- Initial release
