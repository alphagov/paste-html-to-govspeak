# Paste HTML to govspeak

This package provides an event listener that will convert pasted HTML content
on form inputs and textareas into [Govspeak][] (a markdown extension library
for government publishers).

The HTML data available to the browser clipboard is complicated and
inconsistent, learn more about this
[functionality and its limitations](docs/functionality-overview.md).


## Installation

### Via NPM (recommended)

Add this project to your package.json file via NPM or Yarn:

```sh
# NPM
npm install paste-html-to-govspeak --save
# Yarn
yarn add paste-html-to-govspeak
```

### Manual installation

Download [paste-html-to-markdown.js][dist-file] and add it to your
application assets.

## Usage

### Using a bundler (e.g. Webpack)

```js
import { pasteListener } from 'paste-html-to-govspeak'

element.addEventListener('paste', pasteListener)
```

### Without a bundler

```js
element.addEventListener('paste', window.pasteHtmlToGovspeak.pasteListener)
```

## Browser support

- Chrome
- Firefox
- Safari
- Internet Explorer 11
- Microsoft Edge

## Debugging

This package triggers events at different stages in the conversion process
which can be monitored to understand how a particular scenario is occurring.
These events are triggered on the element the `pasteListener` has been applied
to.

These are:

- `htmlpaste` - which is the received HTML from the paste event
- `textpaste` - which is the received text from the paste event
- `govspeak` - which is the resultant govspeak of the HTML conversion, this
  will only be triggered if HTML was present in the paste event.

There is also a `htmlToGovspeak` method that is exposed by the package. Given
a HTML string input this will return Govspeak.

This repo contains [example usages](examples/index.html) of these debugging
tools.

## Development

```
npm install
npm test
```

To continuously build files while developing run:

```
npm run watch
```

## License

Distributed under the MIT license. See LICENSE for details.

[govspeak]: https://github.com/alphagov/govspeak
[dist-file]: https://alphagov.github.io/paste-html-to-govspeak/dist/paste-html-to-markdown.js
