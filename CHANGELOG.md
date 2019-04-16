# Changelog

- We use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
- Mark breaking changes with `BREAKING:`. Be sure to include instructions on
  how applications should be upgraded.
- Include a link to your pull request.
- Don't include changes that are purely internal. The CHANGELOG should be a
  useful summary for people upgrading their application, not a replication
  of the commit log.

## 0.2.2

- Strip links that match URL and are the only content of a paste document (PR #48)

## 0.2.1

- Widen word list support (PR #46)

## 0.2.0

- Convert Microsoft Word lists to markdown lists (PR #42)
- Convert h1 headers to h2, convert h4 and h5 headers to h3 (PR #41)
- Remove comments produced by Microsoft Word 2016 (PR #40)
- Fix dist file containing ES2015 and regex breaking in IE11 (PR #39)
- Remove more undesirable elements and trim output whitespace (PR #38)

## 0.1.1

- Initial release
