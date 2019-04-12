# Functionality overview

The paste HTML to govspeak functionality interfaces with data on a user's
clipboard to attempt to create govspeak formatted text at the point of them
pasting HTML. The expectation for usage is that users copy data from
word processor documents (such as Microsoft Word or Google Docs),
fixed layout documents (such as PDF) or webpage content and paste it into the
tool.

The quality and accuracy of clipboard data can vary significantly depending on
the type of document it is copied from and what program is used to open it.
This means that outcomes can sometimes be surprising. The goal of the tool is
therefore somewhat modest: to consistently provide a paste experience that is
at least as good as pasting plain text and to enhance wherever possible.

This document serves to explain more about how this tool works, it's limitations
and issues discovered in testing scenarios.

## How this tool works

This tools listens for a paste event to occur on a designated element. When
this event occurs it uses the [ClipboardData][] API to check whether the paste
content is available in a HTML format and, if so, converts this HTML to
Govspeak. If HTML is not available it falls back to the browsers default
behaviour - which would be to insert or replace the text content of the paste.

As HTML is a widely understood open format it is frequently available as part
of clipboard data to allow the communication of rich text between applications.
For HTML to be available on a paste event it needs to have been written to the
clipboard at the time it was copied. This is something that is done by the
application displaying the content and may use features of the underlying
operating system. For example, if you copy text in Microsoft Word it will
automatically convert this text to HTML (and other formats such as plain text)
when placing it on the clipboard.

The conversion of HTML to Govspeak is relatively simple. Elements that can be
identified as having a Govspeak equivialent, such as a link, are converted to
their equivalent; elements that are used for non visible data, such as style
information, are removed; and any other elements are converted to their text
representation. This conversion is done by using the [turndown] package.

In order to produce a good Govspeak conversion the HTML must be marked up
[semantically][semantic-html]. This allows the original author's content intent
to be understood by different applications regardless of the formatting. In
order for this to occur the author must have specified these semantics when
producing their document (for example a user selecting text as a heading) and
the application used to read the document must include this information in
copy data to the clipboard.

## Falling back to text input

When pasting this tool will use HTML data if it is available. In most desktop
browsers there is an option to force this to be treated as plain text - which
will disable the effects of this tool.

On Windows and Linux machines this can be achieved by using `Ctrl + Shift + v`
rather than the usual `Ctrl + v` to paste. On macOS the same can be achieved
with `Cmd + Shift + v`.

On some browsers there are also options on the context menu such as "Paste as
plain text" on Windows and "Paste and match style" on macOS. These will paste
in as plain text, bypassing this tool.

## Supported HTML

Only a subset of HTML is converted to Govspeak.

Elements that are converted, but with attributes stripped are:

p, h2, h3, blockquote, pre, code, ol, ul, li, br

Elements that are stripped with allowed attributes are:

a with href, attr with title

Elements that are purposefully stripped for Govspeak consistency, but typically
allowed in markdown are:

h1, h4, h5, h6, b, strong, em, i, img

Most other elements (most notably tables) are converted to just show text
within them, except for ones that contain non-content data (such as style,
script or meta elements) which are removed.

For an example of a best case paste scenario there is an [input example file][],
containing the supported HTML. This can be pasted into the [tool example][]
to see the conversion.

## Overview of testing outcomes

In preparing to deploy this functionality we tested a wide range of scenarios.
The approach to testing was to create a matrix identifying different
authoring tools (such as Microsoft Word, Google Docs) and different output formats
(such as docx, odt, pdf) which could be opened on different platforms. We then
looked at other common sources of content such as web pages or e-mail clients.

### Common issues

We found that saving from tools such as Word or Google Docs to cross platform
formats such as ODT or RTF didn't have a significant impact on the formatting
of the document. However this did produce some buggy circumstances such as
[headers embedded in ordered lists][headers-in-ordered-lists].

If a document has content separated with line breaks, these may often be
converted into separate paragraphs which creates an additional line break. This
happens when the source document stores the separate lines as separate
paragraphs.

It is expected that users may copy and paste Govspeak/markdown from example
sources that are represented in HTML (for example [How to publish on GOV.UK][]).
Because of this no markdown is escaped when it is within HTML. This can impact
users who wish to use characters that have a syntactic meaning in Govspeak.

If a document author uses text formatting to create semantic meaning (such as
headers or lists) this information won't be retained when converting
to Govspeak. This is because the source document is unable to output this with
semantic meaning. In some cases (detailed below) some word processing tools
will still strip the semantic meaning even if it is present in the document.

### Microsoft Word 2016

Testing the authoring and copying of content produced mostly positive results
with Word 2016. Headers, paragraphs and most links copied successfully.

Lists unfortunately were problematic. Word copies these as a sequence of
paragraphs with bullet characters preserved.

Another identified issue was that automatic links to email addresses weren't
copying as valid links as they missed a `href` attribute, for example
`<a>user@example.com</a>`. These end up being stripped to text in conversion.

### Google Docs

Using Google Docs provides two different experiences depending on how the
document is opened: editing and previewing.

#### Editing a document

Copying from the edit interface provided a good copy and pasting experience,
with semantic markup copied and converted.

We discovered, and resolved, a couple of issues relating to lists. The first
being that [list items contained paragraph markup][li-paragraph]. The
second that [nested lists appear with invalid HTML][gdocs-list-workaround].

### Previewing a document

When documents are opened using the preview mode in Google Docs a copy does not
include a HTML variant so no enhancement is available. Therefore, these paste
as if they were plain text.

### [Office Editing for Docs, Sheets and Slides][office-extension] chrome extension

Google provide this popular chrome extension that allows opening many of the
common Microsoft Office formats in the Chrome web browser. These look very
similar to Google Docs but behave differently.

The HTML that is copied from this source is less semantic than Google Docs,
with most semantic markup (such as headers and lists) converted to paragraphs.
Links do seem to be persisted.

We did encounter a strange issue - that may be a problem with the extension -
where documents longer than 2 pages didn't copy content past the 2nd page in
either HTML or text pasting.

### PDF documents

PDF documents mostly copy as only plain text or have minimal
HTML available, thus these have little to no Govspeak available when
pasted. In some circumstances we found PDF to provide a particularly poor
experience by stripping all line breaks or including superfluous characters.

Different PDF readers all seemed to produce different HTML results, with the
common theme being a lack of semantic information.

In some cases the HTML paste of a PDF was worse than that of plain text, which
falls short of our goal for this tool. This may need future iteration.

### Copying from websites and email clients

The experience of copying from websites and email clients is mostly positive
with the output mostly determined from the quality of the underlying HTML
rather than any particular behaviour applied by applications.

Pages with complex layouts that involve lists can produce surprising outputs,
where the conversion process attempts to embed a collection of things in a
single list item.

[ClipboardData]: https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent/clipboardData
[turndown]: https://github.com/domchristie/turndown
[semantic-html]: https://www.lifewire.com/why-use-semantic-html-3468271
[input example file]: https://alphagov.github.io/paste-html-to-govspeak/input.html
[tool example]: https://alphagov.github.io/paste-html-to-govspeak/
[headers-in-ordered-lists]: https://github.com/alphagov/paste-html-to-govspeak/pull/25/commits/79320643bd8999e9ea646ea1342962fe184cdc95
[How to publish on GOV.UK]: https://www.gov.uk/guidance/how-to-publish-on-gov-uk/markdown
[office-extension]: https://chrome.google.com/webstore/detail/office-editing-for-docs-s/gbkeegbaiigmenfmjfclcdgdpimamgkj
[li-paragraph]: https://github.com/alphagov/paste-html-to-govspeak/pull/23/commits/4f0708be72dc72a81cd6d459d1d71dc69fc68d9a
[gdocs-list-workaround]: https://github.com/alphagov/paste-html-to-govspeak/pull/26/commits/b61c64653b2c57cfd529285fdcd267b64cbcad81
