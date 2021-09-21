(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.pasteHtmlToGovspeak = {}));
}(this, (function (exports) { 'use strict';

  function extend (destination) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) destination[key] = source[key];
      }
    }
    return destination
  }

  function repeat (character, count) {
    return Array(count + 1).join(character)
  }

  var blockElements = [
    'address', 'article', 'aside', 'audio', 'blockquote', 'body', 'canvas',
    'center', 'dd', 'dir', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
    'figure', 'footer', 'form', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'header', 'hgroup', 'hr', 'html', 'isindex', 'li', 'main', 'menu', 'nav',
    'noframes', 'noscript', 'ol', 'output', 'p', 'pre', 'section', 'table',
    'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul'
  ];

  function isBlock (node) {
    return blockElements.indexOf(node.nodeName.toLowerCase()) !== -1
  }

  var voidElements = [
    'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
    'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'
  ];

  function isVoid (node) {
    return voidElements.indexOf(node.nodeName.toLowerCase()) !== -1
  }

  var voidSelector = voidElements.join();
  function hasVoid (node) {
    return node.querySelector && node.querySelector(voidSelector)
  }

  var rules = {};

  rules.paragraph = {
    filter: 'p',

    replacement: function (content) {
      return '\n\n' + content + '\n\n'
    }
  };

  rules.lineBreak = {
    filter: 'br',

    replacement: function (content, node, options) {
      return options.br + '\n'
    }
  };

  rules.heading = {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

    replacement: function (content, node, options) {
      var hLevel = Number(node.nodeName.charAt(1));

      if (options.headingStyle === 'setext' && hLevel < 3) {
        var underline = repeat((hLevel === 1 ? '=' : '-'), content.length);
        return (
          '\n\n' + content + '\n' + underline + '\n\n'
        )
      } else {
        return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n'
      }
    }
  };

  rules.blockquote = {
    filter: 'blockquote',

    replacement: function (content) {
      content = content.replace(/^\n+|\n+$/g, '');
      content = content.replace(/^/gm, '> ');
      return '\n\n' + content + '\n\n'
    }
  };

  rules.list = {
    filter: ['ul', 'ol'],

    replacement: function (content, node) {
      var parent = node.parentNode;
      if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
        return '\n' + content
      } else {
        return '\n\n' + content + '\n\n'
      }
    }
  };

  rules.listItem = {
    filter: 'li',

    replacement: function (content, node, options) {
      content = content
        .replace(/^\n+/, '') // remove leading newlines
        .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
        .replace(/\n/gm, '\n    '); // indent
      var prefix = options.bulletListMarker + '   ';
      var parent = node.parentNode;
      if (parent.nodeName === 'OL') {
        var start = parent.getAttribute('start');
        var index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + '.  ';
      }
      return (
        prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '')
      )
    }
  };

  rules.indentedCodeBlock = {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'indented' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },

    replacement: function (content, node, options) {
      return (
        '\n\n    ' +
        node.firstChild.textContent.replace(/\n/g, '\n    ') +
        '\n\n'
      )
    }
  };

  rules.fencedCodeBlock = {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      )
    },

    replacement: function (content, node, options) {
      var className = node.firstChild.className || '';
      var language = (className.match(/language-(\S+)/) || [null, ''])[1];
      var code = node.firstChild.textContent;

      var fenceChar = options.fence.charAt(0);
      var fenceSize = 3;
      var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');

      var match;
      while ((match = fenceInCodeRegex.exec(code))) {
        if (match[0].length >= fenceSize) {
          fenceSize = match[0].length + 1;
        }
      }

      var fence = repeat(fenceChar, fenceSize);

      return (
        '\n\n' + fence + language + '\n' +
        code.replace(/\n$/, '') +
        '\n' + fence + '\n\n'
      )
    }
  };

  rules.horizontalRule = {
    filter: 'hr',

    replacement: function (content, node, options) {
      return '\n\n' + options.hr + '\n\n'
    }
  };

  rules.inlineLink = {
    filter: function (node, options) {
      return (
        options.linkStyle === 'inlined' &&
        node.nodeName === 'A' &&
        node.getAttribute('href')
      )
    },

    replacement: function (content, node) {
      var href = node.getAttribute('href');
      var title = node.title ? ' "' + node.title + '"' : '';
      return '[' + content + '](' + href + title + ')'
    }
  };

  rules.referenceLink = {
    filter: function (node, options) {
      return (
        options.linkStyle === 'referenced' &&
        node.nodeName === 'A' &&
        node.getAttribute('href')
      )
    },

    replacement: function (content, node, options) {
      var href = node.getAttribute('href');
      var title = node.title ? ' "' + node.title + '"' : '';
      var replacement;
      var reference;

      switch (options.linkReferenceStyle) {
        case 'collapsed':
          replacement = '[' + content + '][]';
          reference = '[' + content + ']: ' + href + title;
          break
        case 'shortcut':
          replacement = '[' + content + ']';
          reference = '[' + content + ']: ' + href + title;
          break
        default:
          var id = this.references.length + 1;
          replacement = '[' + content + '][' + id + ']';
          reference = '[' + id + ']: ' + href + title;
      }

      this.references.push(reference);
      return replacement
    },

    references: [],

    append: function (options) {
      var references = '';
      if (this.references.length) {
        references = '\n\n' + this.references.join('\n') + '\n\n';
        this.references = []; // Reset references
      }
      return references
    }
  };

  rules.emphasis = {
    filter: ['em', 'i'],

    replacement: function (content, node, options) {
      if (!content.trim()) return ''
      return options.emDelimiter + content + options.emDelimiter
    }
  };

  rules.strong = {
    filter: ['strong', 'b'],

    replacement: function (content, node, options) {
      if (!content.trim()) return ''
      return options.strongDelimiter + content + options.strongDelimiter
    }
  };

  rules.code = {
    filter: function (node) {
      var hasSiblings = node.previousSibling || node.nextSibling;
      var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;

      return node.nodeName === 'CODE' && !isCodeBlock
    },

    replacement: function (content) {
      if (!content.trim()) return ''

      var delimiter = '`';
      var leadingSpace = '';
      var trailingSpace = '';
      var matches = content.match(/`+/gm);
      if (matches) {
        if (/^`/.test(content)) leadingSpace = ' ';
        if (/`$/.test(content)) trailingSpace = ' ';
        while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';
      }

      return delimiter + leadingSpace + content + trailingSpace + delimiter
    }
  };

  rules.image = {
    filter: 'img',

    replacement: function (content, node) {
      var alt = node.alt || '';
      var src = node.getAttribute('src') || '';
      var title = node.title || '';
      var titlePart = title ? ' "' + title + '"' : '';
      return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
    }
  };

  /**
   * Manages a collection of rules used to convert HTML to Markdown
   */

  function Rules (options) {
    this.options = options;
    this._keep = [];
    this._remove = [];

    this.blankRule = {
      replacement: options.blankReplacement
    };

    this.keepReplacement = options.keepReplacement;

    this.defaultRule = {
      replacement: options.defaultReplacement
    };

    this.array = [];
    for (var key in options.rules) this.array.push(options.rules[key]);
  }

  Rules.prototype = {
    add: function (key, rule) {
      this.array.unshift(rule);
    },

    keep: function (filter) {
      this._keep.unshift({
        filter: filter,
        replacement: this.keepReplacement
      });
    },

    remove: function (filter) {
      this._remove.unshift({
        filter: filter,
        replacement: function () {
          return ''
        }
      });
    },

    forNode: function (node) {
      if (node.isBlank) return this.blankRule
      var rule;

      if ((rule = findRule(this.array, node, this.options))) return rule
      if ((rule = findRule(this._keep, node, this.options))) return rule
      if ((rule = findRule(this._remove, node, this.options))) return rule

      return this.defaultRule
    },

    forEach: function (fn) {
      for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
    }
  };

  function findRule (rules, node, options) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (filterValue(rule, node, options)) return rule
    }
    return void 0
  }

  function filterValue (rule, node, options) {
    var filter = rule.filter;
    if (typeof filter === 'string') {
      if (filter === node.nodeName.toLowerCase()) return true
    } else if (Array.isArray(filter)) {
      if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true
    } else if (typeof filter === 'function') {
      if (filter.call(rule, node, options)) return true
    } else {
      throw new TypeError('`filter` needs to be a string, array, or function')
    }
  }

  /**
   * The collapseWhitespace function is adapted from collapse-whitespace
   * by Luc Thevenard.
   *
   * The MIT License (MIT)
   *
   * Copyright (c) 2014 Luc Thevenard <lucthevenard@gmail.com>
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */

  /**
   * collapseWhitespace(options) removes extraneous whitespace from an the given element.
   *
   * @param {Object} options
   */
  function collapseWhitespace (options) {
    var element = options.element;
    var isBlock = options.isBlock;
    var isVoid = options.isVoid;
    var isPre = options.isPre || function (node) {
      return node.nodeName === 'PRE'
    };

    if (!element.firstChild || isPre(element)) return

    var prevText = null;
    var prevVoid = false;

    var prev = null;
    var node = next(prev, element, isPre);

    while (node !== element) {
      if (node.nodeType === 3 || node.nodeType === 4) { // Node.TEXT_NODE or Node.CDATA_SECTION_NODE
        var text = node.data.replace(/[ \r\n\t]+/g, ' ');

        if ((!prevText || / $/.test(prevText.data)) &&
            !prevVoid && text[0] === ' ') {
          text = text.substr(1);
        }

        // `text` might be empty at this point.
        if (!text) {
          node = remove(node);
          continue
        }

        node.data = text;

        prevText = node;
      } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
        if (isBlock(node) || node.nodeName === 'BR') {
          if (prevText) {
            prevText.data = prevText.data.replace(/ $/, '');
          }

          prevText = null;
          prevVoid = false;
        } else if (isVoid(node)) {
          // Avoid trimming space around non-block, non-BR void elements.
          prevText = null;
          prevVoid = true;
        }
      } else {
        node = remove(node);
        continue
      }

      var nextNode = next(prev, node, isPre);
      prev = node;
      node = nextNode;
    }

    if (prevText) {
      prevText.data = prevText.data.replace(/ $/, '');
      if (!prevText.data) {
        remove(prevText);
      }
    }
  }

  /**
   * remove(node) removes the given node from the DOM and returns the
   * next node in the sequence.
   *
   * @param {Node} node
   * @return {Node} node
   */
  function remove (node) {
    var next = node.nextSibling || node.parentNode;

    node.parentNode.removeChild(node);

    return next
  }

  /**
   * next(prev, current, isPre) returns the next node in the sequence, given the
   * current and previous nodes.
   *
   * @param {Node} prev
   * @param {Node} current
   * @param {Function} isPre
   * @return {Node}
   */
  function next (prev, current, isPre) {
    if ((prev && prev.parentNode === current) || isPre(current)) {
      return current.nextSibling || current.parentNode
    }

    return current.firstChild || current.nextSibling || current.parentNode
  }

  /*
   * Set up window for Node.js
   */

  var root = (typeof window !== 'undefined' ? window : {});

  /*
   * Parsing HTML strings
   */

  function canParseHTMLNatively () {
    var Parser = root.DOMParser;
    var canParse = false;

    // Adapted from https://gist.github.com/1129031
    // Firefox/Opera/IE throw errors on unsupported types
    try {
      // WebKit returns null on unsupported types
      if (new Parser().parseFromString('', 'text/html')) {
        canParse = true;
      }
    } catch (e) {}

    return canParse
  }

  function createHTMLParser () {
    var Parser = function () {};

    {
      var JSDOM = require('jsdom').JSDOM;
      Parser.prototype.parseFromString = function (string) {
        return new JSDOM(string).window.document
      };
    }
    return Parser
  }

  var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();

  function RootNode (input) {
    var root;
    if (typeof input === 'string') {
      var doc = htmlParser().parseFromString(
        // DOM parsers arrange elements in the <head> and <body>.
        // Wrapping in a custom element ensures elements are reliably arranged in
        // a single element.
        '<x-turndown id="turndown-root">' + input + '</x-turndown>',
        'text/html'
      );
      root = doc.getElementById('turndown-root');
    } else {
      root = input.cloneNode(true);
    }
    collapseWhitespace({
      element: root,
      isBlock: isBlock,
      isVoid: isVoid
    });

    return root
  }

  var _htmlParser;
  function htmlParser () {
    _htmlParser = _htmlParser || new HTMLParser();
    return _htmlParser
  }

  function Node (node) {
    node.isBlock = isBlock(node);
    node.isCode = node.nodeName.toLowerCase() === 'code' || node.parentNode.isCode;
    node.isBlank = isBlank(node);
    node.flankingWhitespace = flankingWhitespace(node);
    return node
  }

  function isBlank (node) {
    return (
      ['A', 'TH', 'TD', 'IFRAME', 'SCRIPT', 'AUDIO', 'VIDEO'].indexOf(node.nodeName) === -1 &&
      /^\s*$/i.test(node.textContent) &&
      !isVoid(node) &&
      !hasVoid(node)
    )
  }

  function flankingWhitespace (node) {
    var leading = '';
    var trailing = '';

    if (!node.isBlock) {
      var hasLeading = /^\s/.test(node.textContent);
      var hasTrailing = /\s$/.test(node.textContent);
      var blankWithSpaces = node.isBlank && hasLeading && hasTrailing;

      if (hasLeading && !isFlankedByWhitespace('left', node)) {
        leading = ' ';
      }

      if (!blankWithSpaces && hasTrailing && !isFlankedByWhitespace('right', node)) {
        trailing = ' ';
      }
    }

    return { leading: leading, trailing: trailing }
  }

  function isFlankedByWhitespace (side, node) {
    var sibling;
    var regExp;
    var isFlanked;

    if (side === 'left') {
      sibling = node.previousSibling;
      regExp = / $/;
    } else {
      sibling = node.nextSibling;
      regExp = /^ /;
    }

    if (sibling) {
      if (sibling.nodeType === 3) {
        isFlanked = regExp.test(sibling.nodeValue);
      } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
        isFlanked = regExp.test(sibling.textContent);
      }
    }
    return isFlanked
  }

  var reduce = Array.prototype.reduce;
  var leadingNewLinesRegExp = /^\n*/;
  var trailingNewLinesRegExp = /\n*$/;
  var escapes = [
    [/\\/g, '\\\\'],
    [/\*/g, '\\*'],
    [/^-/g, '\\-'],
    [/^\+ /g, '\\+ '],
    [/^(=+)/g, '\\$1'],
    [/^(#{1,6}) /g, '\\$1 '],
    [/`/g, '\\`'],
    [/^~~~/g, '\\~~~'],
    [/\[/g, '\\['],
    [/\]/g, '\\]'],
    [/^>/g, '\\>'],
    [/_/g, '\\_'],
    [/^(\d+)\. /g, '$1\\. ']
  ];

  function TurndownService (options) {
    if (!(this instanceof TurndownService)) return new TurndownService(options)

    var defaults = {
      rules: rules,
      headingStyle: 'setext',
      hr: '* * *',
      bulletListMarker: '*',
      codeBlockStyle: 'indented',
      fence: '```',
      emDelimiter: '_',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
      br: '  ',
      blankReplacement: function (content, node) {
        return node.isBlock ? '\n\n' : ''
      },
      keepReplacement: function (content, node) {
        return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML
      },
      defaultReplacement: function (content, node) {
        return node.isBlock ? '\n\n' + content + '\n\n' : content
      }
    };
    this.options = extend({}, defaults, options);
    this.rules = new Rules(this.options);
  }

  TurndownService.prototype = {
    /**
     * The entry point for converting a string or DOM node to Markdown
     * @public
     * @param {String|HTMLElement} input The string or DOM node to convert
     * @returns A Markdown representation of the input
     * @type String
     */

    turndown: function (input) {
      if (!canConvert(input)) {
        throw new TypeError(
          input + ' is not a string, or an element/document/fragment node.'
        )
      }

      if (input === '') return ''

      var output = process.call(this, new RootNode(input));
      return postProcess.call(this, output)
    },

    /**
     * Add one or more plugins
     * @public
     * @param {Function|Array} plugin The plugin or array of plugins to add
     * @returns The Turndown instance for chaining
     * @type Object
     */

    use: function (plugin) {
      if (Array.isArray(plugin)) {
        for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
      } else if (typeof plugin === 'function') {
        plugin(this);
      } else {
        throw new TypeError('plugin must be a Function or an Array of Functions')
      }
      return this
    },

    /**
     * Adds a rule
     * @public
     * @param {String} key The unique key of the rule
     * @param {Object} rule The rule
     * @returns The Turndown instance for chaining
     * @type Object
     */

    addRule: function (key, rule) {
      this.rules.add(key, rule);
      return this
    },

    /**
     * Keep a node (as HTML) that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */

    keep: function (filter) {
      this.rules.keep(filter);
      return this
    },

    /**
     * Remove a node that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */

    remove: function (filter) {
      this.rules.remove(filter);
      return this
    },

    /**
     * Escapes Markdown syntax
     * @public
     * @param {String} string The string to escape
     * @returns A string with Markdown syntax escaped
     * @type String
     */

    escape: function (string) {
      return escapes.reduce(function (accumulator, escape) {
        return accumulator.replace(escape[0], escape[1])
      }, string)
    }
  };

  /**
   * Reduces a DOM node down to its Markdown string equivalent
   * @private
   * @param {HTMLElement} parentNode The node to convert
   * @returns A Markdown representation of the node
   * @type String
   */

  function process (parentNode) {
    var self = this;
    return reduce.call(parentNode.childNodes, function (output, node) {
      node = new Node(node);

      var replacement = '';
      if (node.nodeType === 3) {
        replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
      } else if (node.nodeType === 1) {
        replacement = replacementForNode.call(self, node);
      }

      return join(output, replacement)
    }, '')
  }

  /**
   * Appends strings as each rule requires and trims the output
   * @private
   * @param {String} output The conversion output
   * @returns A trimmed version of the ouput
   * @type String
   */

  function postProcess (output) {
    var self = this;
    this.rules.forEach(function (rule) {
      if (typeof rule.append === 'function') {
        output = join(output, rule.append(self.options));
      }
    });

    return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '')
  }

  /**
   * Converts an element node to its Markdown equivalent
   * @private
   * @param {HTMLElement} node The node to convert
   * @returns A Markdown representation of the node
   * @type String
   */

  function replacementForNode (node) {
    var rule = this.rules.forNode(node);
    var content = process.call(this, node);
    var whitespace = node.flankingWhitespace;
    if (whitespace.leading || whitespace.trailing) content = content.trim();
    return (
      whitespace.leading +
      rule.replacement(content, node, this.options) +
      whitespace.trailing
    )
  }

  /**
   * Determines the new lines between the current output and the replacement
   * @private
   * @param {String} output The current conversion output
   * @param {String} replacement The string to append to the output
   * @returns The whitespace to separate the current output and the replacement
   * @type String
   */

  function separatingNewlines (output, replacement) {
    var newlines = [
      output.match(trailingNewLinesRegExp)[0],
      replacement.match(leadingNewLinesRegExp)[0]
    ].sort();
    var maxNewlines = newlines[newlines.length - 1];
    return maxNewlines.length < 2 ? maxNewlines : '\n\n'
  }

  function join (string1, string2) {
    var separator = separatingNewlines(string1, string2);

    // Remove trailing/leading newlines and replace with separator
    string1 = string1.replace(trailingNewLinesRegExp, '');
    string2 = string2.replace(leadingNewLinesRegExp, '');

    return string1 + separator + string2
  }

  /**
   * Determines whether an input can be converted
   * @private
   * @param {String|HTMLElement} input Describe this parameter
   * @returns Describe what it returns
   * @type String|Object|Array|Boolean|Number
   */

  function canConvert (input) {
    return (
      input != null && (
        typeof input === 'string' ||
        (input.nodeType && (
          input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11
        ))
      )
    )
  }

  var service = new TurndownService({
    bulletListMarker: '-',
    listIndent: '   ',
    // 3 spaces
    blankReplacement: function blankReplacement(content, node) {
      if (node.isBlock) {
        return '\n\n';
      } // This fixes an issue with turndown where an element with a space
      // inside can be removed causing a jarring HTML coversion.


      var hasWhitespace = /\s/.test(node.textContent);
      var hasFlanking = node.flankingWhitespace.trailing || node.flankingWhitespace.leading;
      return hasWhitespace && !hasFlanking ? ' ' : '';
    }
  }); // define all the elements we want stripped from output

  var elementsToRemove = ['title', 'script', 'noscript', 'style', 'video', 'audio', 'object', 'iframe'];

  for (var _i = 0, _elementsToRemove = elementsToRemove; _i < _elementsToRemove.length; _i++) {
    var element = _elementsToRemove[_i];
    service.remove(element);
  } // As a user may have pasted markdown we rather crudley
  // stop all escaping


  service.escape = function (string) {
    return string;
  }; // turndown keeps title attribute attributes of links by default which isn't
  // what is expected in govspeak


  service.addRule('link', {
    filter: function filter(node) {
      return node.nodeName.toLowerCase() === 'a' && node.getAttribute('href');
    },
    replacement: function replacement(content, node) {
      if (content.trim() === '') {
        return '';
      } else {
        return "[".concat(content, "](").concat(node.getAttribute('href'), ")");
      }
    }
  });
  service.addRule('abbr', {
    filter: function filter(node) {
      return node.nodeName.toLowerCase() === 'abbr' && node.getAttribute('title');
    },
    replacement: function replacement(content, node) {
      this.references[content] = node.getAttribute('title');
      return content;
    },
    references: {},
    append: function append() {
      if (Object.keys(this.references).length === 0) {
        return '';
      }

      var references = '\n\n';

      for (var abbr in this.references) {
        references += "*[".concat(abbr, "]: ").concat(this.references[abbr], "\n");
      }

      this.references = {}; // reset after appending

      return references;
    }
  }); // GOV.UK content authors are encouraged to only use h2 and h3 headers, this
  // converts other headers to be one of these (except h6 which is converted
  // to a paragraph

  service.addRule('heading', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: function replacement(content, node) {
      var prefix;
      var number = node.nodeName.charAt(1);

      if (number === '1' || number === '2') {
        prefix = '## ';
      } else if (number === '3' || number === '4' || number === '5') {
        prefix = '### ';
      } else {
        prefix = '';
      }

      return "\n\n".concat(prefix).concat(content, "\n\n");
    }
  }); // remove images
  // this needs to be set as a rule rather than remove as it's part of turndown
  // commonmark rules that needs overriding

  service.addRule('img', {
    filter: ['img'],
    replacement: function replacement() {
      return '';
    }
  }); // remove bold

  service.addRule('bold', {
    filter: ['b', 'strong'],
    replacement: function replacement(content) {
      return content;
    }
  }); // remove italic

  service.addRule('italic', {
    filter: ['i', 'em'],
    replacement: function replacement(content) {
      return content;
    }
  });
  service.addRule('removeEmptyParagraphs', {
    filter: function filter(node) {
      return node.nodeName.toLowerCase() === 'p' && node.textContent.trim() === '';
    },
    replacement: function replacement() {
      return '';
    }
  }); // strip paragraph elements within list items

  service.addRule('stripParagraphsInListItems', {
    filter: function filter(node) {
      return node.nodeName.toLowerCase() === 'p' && node.parentNode.nodeName.toLowerCase() === 'li';
    },
    replacement: function replacement(content) {
      return content;
    }
  });
  service.addRule('cleanUpNestedLinks', {
    filter: function filter(node) {
      if (node.nodeName.toLowerCase() === 'a' && node.previousSibling) {
        return node.previousSibling.textContent.match(/\]\($/);
      }
    },
    replacement: function replacement(content, node) {
      return node.getAttribute('href');
    }
  }); // Google docs has a habit of producing nested lists that are not nested
  // with valid HTML. Rather than embedding sub lists inside an <li> element they
  // are nested in the <ul> or <ol> element.

  service.addRule('invalidNestedLists', {
    filter: function filter(node) {
      var nodeName = node.nodeName.toLowerCase();

      if ((nodeName === 'ul' || nodeName === 'ol') && node.previousElementSibling) {
        var previousNodeName = node.previousElementSibling.nodeName.toLowerCase();
        return previousNodeName === 'li';
      }
    },
    replacement: function replacement(content, node, options) {
      content = content.replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '') // replace trailing newlines
      .replace(/\n/gm, "\n".concat(options.listIndent)); // indent all nested content in the list
      // indent this list to match sibling

      return options.listIndent + content + '\n';
    }
  }); // This is ported from https://github.com/domchristie/turndown/blob/80297cebeae4b35c8d299b1741b383c74eddc7c1/src/commonmark-rules.js#L61-L80
  // It is modified in the following ways:
  // - Only determines ol ordering based on li elements
  // - Removes handling of ol start attribute as this doesn't affect govspeak output
  // - Makes spacing consistent with gov.uk markdown guidance

  service.addRule('listItems', {
    filter: 'li',
    replacement: function replacement(content, node, options) {
      content = content.replace(/^\n+/, '') // remove leading newlines
      .replace(/\n+$/, '\n') // replace trailing newlines with just a single one
      .replace(/\n/gm, "\n".concat(options.listIndent)); // indent all nested content in the list

      var prefix = options.bulletListMarker + ' ';
      var parent = node.parentNode;

      if (parent.nodeName.toLowerCase() === 'ol') {
        var listItems = Array.prototype.filter.call(parent.children, function (element) {
          return element.nodeName.toLowerCase() === 'li';
        });
        var index = Array.prototype.indexOf.call(listItems, node);
        prefix = (index + 1).toString() + '. ';
      }

      return prefix + content + (node.nextSibling && !/\n$/.test(content) ? '\n' : '');
    }
  });
  service.addRule('removeMsWordCommentElements', {
    filter: function filter(node) {
      var nodeName = node.nodeName.toLowerCase();
      var classList = node.classList;

      if (nodeName === 'hr' && classList.contains('msocomoff')) {
        return true;
      }

      if (nodeName === 'span' && classList.contains('MsoCommentReference')) {
        return true;
      }

      if (nodeName === 'div' && classList.contains('msocomtxt')) {
        return true;
      }
    },
    replacement: function replacement() {
      return '';
    }
  });
  service.addRule('removeMsWordListBullets', {
    filter: function filter(node) {
      if (node.nodeName.toLowerCase() === 'span') {
        var style = node.getAttribute('style');
        return style ? style.match(/mso-list:ignore/i) : false;
      }
    },
    replacement: function replacement() {
      return '';
    }
  }); // Given a node it returns the Microsoft Word list level, returning undefined
  // for an item that isn't a MS Word list node

  function getMsWordListLevel(node) {
    if (node.nodeName.toLowerCase() !== 'p') {
      return;
    }

    var style = node.getAttribute('style');
    var levelMatch = style && style.match(/mso-list/i) ? style.match(/level(\d+)/) : null;
    return levelMatch ? parseInt(levelMatch[1], 10) : undefined;
  }

  function isMsWordListItem(node) {
    return !!getMsWordListLevel(node);
  } // Based on a node that is a list item in a MS Word document, this returns
  // the marker for the list.


  function msWordListMarker(node, bulletListMarker) {
    var markerElement = node.querySelector('span[style="mso-list:Ignore"]'); // assume the presence of a period in a marker is an indicator of an
    // ordered list

    if (!markerElement || !markerElement.textContent.match(/\./)) {
      return bulletListMarker;
    }

    var nodeLevel = getMsWordListLevel(node);
    var item = 1;
    var potentialListItem = node.previousElementSibling; // loop through previous siblings to count list items

    while (potentialListItem) {
      var itemLevel = getMsWordListLevel(potentialListItem); // if there are no more list items or we encounter the lists parent
      // we don't need to count further

      if (!itemLevel || itemLevel < nodeLevel) {
        break;
      } // if on same level increment the list items


      if (nodeLevel === itemLevel) {
        item += 1;
      }

      potentialListItem = potentialListItem.previousElementSibling;
    }

    return "".concat(item, ".");
  }

  service.addRule('addMsWordListItem', {
    filter: function filter(node) {
      return isMsWordListItem(node);
    },
    replacement: function replacement(content, node, options) {
      var firstListItem = !node.previousElementSibling || !isMsWordListItem(node.previousElementSibling);
      var prefix = firstListItem ? '\n\n' : ''; // we can determine the nesting of a list by a mso-list style attribute
      // with a level

      var nodeLevel = getMsWordListLevel(node);

      for (var i = 1; i < nodeLevel; i++) {
        prefix += options.listIndent;
      }

      var lastListItem = !node.nextElementSibling || !isMsWordListItem(node.nextElementSibling);
      var suffix = lastListItem ? '\n\n' : '\n';
      var listMarker = msWordListMarker(node, options.bulletListMarker);
      return "".concat(prefix).concat(listMarker, " ").concat(content.trim()).concat(suffix);
    }
  }); // Remove links that have same href as link text and are the only content
  // in a pasted document. This is because we assume here that they're trying
  // to paste just a plain text URL.

  service.addRule('removeAddressBarLinks', {
    filter: function filter(node, options) {
      if (node.nodeName.toLowerCase() !== 'a' || !node.getAttribute('href')) {
        return;
      }

      var href = node.getAttribute('href').trim();
      return href === node.textContent.trim() && href === node.ownerDocument.body.textContent.trim();
    },
    replacement: function replacement(content) {
      return content;
    }
  });

  function removeBrParagraphs(govspeak) {
    // This finds places where we have a br in a paragraph on it's own and
    // removes it.
    //
    // E.g. if we have HTML of <b><p>Text</p><br><p>More text</p></b> (as google
    // docs can easily produce) which produces govspeak of
    // "Text\n\n  \n\nMore Text". This regexp can strip this back to be
    // Text\n\nMore Text
    var regExp = new RegExp("\n(".concat(service.options.br, "\n)+\n?"), 'g');
    return govspeak.replace(regExp, '\n');
  }

  function extractHeadingsFromLists(govspeak) {
    // This finds instances of headings within ordered lists and replaces them
    // with the headings only. This only applies to H2 and H3.
    var headingsInListsRegExp = /\d\.\s(#{2,3})/g;
    return govspeak.replace(headingsInListsRegExp, '$1');
  }

  function postProcess$1(govspeak) {
    var govspeakWithExtractedHeadings = extractHeadingsFromLists(govspeak);
    var brsRemoved = removeBrParagraphs(govspeakWithExtractedHeadings);
    var whitespaceStripped = brsRemoved.trim();
    return whitespaceStripped;
  }

  function htmlToGovspeak(html) {
    var govspeak = service.turndown(html);
    return postProcess$1(govspeak);
  }

  var browserSupportsTextareaTextNodes;
  /**
   * @param {HTMLElement} input
   * @return {boolean}
   */

  function canManipulateViaTextNodes(input) {
    if (input.nodeName !== "TEXTAREA") {
      return false;
    }

    if (typeof browserSupportsTextareaTextNodes === "undefined") {
      var textarea = document.createElement("textarea");
      textarea.value = 1;
      browserSupportsTextareaTextNodes = !!textarea.firstChild;
    }

    return browserSupportsTextareaTextNodes;
  }
  /**
   * @param {HTMLTextAreaElement|HTMLInputElement} input
   * @param {string} text
   * @returns {void}
   */


  function index (input, text) {
    // Most of the used APIs only work with the field selected
    input.focus(); // IE 8-10

    if (document.selection) {
      var ieRange = document.selection.createRange();
      ieRange.text = text; // Move cursor after the inserted text

      ieRange.collapse(false
      /* to the end */
      );
      ieRange.select();
      return;
    } // Webkit + Edge


    var isSuccess = document.execCommand("insertText", false, text);

    if (!isSuccess) {
      var start = input.selectionStart;
      var end = input.selectionEnd; // Firefox (non-standard method)

      if (typeof input.setRangeText === "function") {
        input.setRangeText(text);
      } else {
        // To make a change we just need a Range, not a Selection
        var range = document.createRange();
        var textNode = document.createTextNode(text);

        if (canManipulateViaTextNodes(input)) {
          var node = input.firstChild; // If textarea is empty, just insert the text

          if (!node) {
            input.appendChild(textNode);
          } else {
            // Otherwise we need to find a nodes for start and end
            var offset = 0;
            var startNode = null;
            var endNode = null;

            while (node && (startNode === null || endNode === null)) {
              var nodeLength = node.nodeValue.length; // if start of the selection falls into current node

              if (start >= offset && start <= offset + nodeLength) {
                range.setStart(startNode = node, start - offset);
              } // if end of the selection falls into current node


              if (end >= offset && end <= offset + nodeLength) {
                range.setEnd(endNode = node, end - offset);
              }

              offset += nodeLength;
              node = node.nextSibling;
            } // If there is some text selected, remove it as we should replace it


            if (start !== end) {
              range.deleteContents();
            }
          }
        } // If the node is a textarea and the range doesn't span outside the element
        //
        // Get the commonAncestorContainer of the selected range and test its type
        // If the node is of type `#text` it means that we're still working with text nodes within our textarea element
        // otherwise, if it's of type `#document` for example it means our selection spans outside the textarea.


        if (canManipulateViaTextNodes(input) && range.commonAncestorContainer.nodeName === "#text") {
          // Finally insert a new node. The browser will automatically split start and end nodes into two if necessary
          range.insertNode(textNode);
        } else {
          // If the node is not a textarea or the range spans outside a textarea the only way is to replace the whole value
          var value = input.value;
          input.value = value.slice(0, start) + text + value.slice(end);
        }
      } // Correct the cursor position to be at the end of the insertion


      input.setSelectionRange(start + text.length, start + text.length); // Notify any possible listeners of the change

      var e = document.createEvent("UIEvent");
      e.initEvent("input", true, false);
      input.dispatchEvent(e);
    }
  }

  // This file provides a technique to maintain html that is pasted in legacy
  // browsers, such as Internet Explorer that lack support for
  // clipboardData.getData('text/html') on a paste event.
  // This involves creating a hidden element, pasting into that, acessing the
  // innerHTML of that element before finally removing it.
  // This approach is explained more thoroughly in: https://www.lucidchart.com/techblog/2014/12/02/definitive-guide-copying-pasting-javascript/
  function createHiddenElement() {
    var hiddenElement = document.createElement('div');
    hiddenElement.setAttribute('contenteditable', true);
    hiddenElement.setAttribute('style', 'position: absolute; top:0; left: 0; opacity: 0;');
    document.body.appendChild(hiddenElement);
    return hiddenElement;
  }

  function removeElement(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }

  function getHtmlUsingHiddenElement(hiddenElement) {
    hiddenElement.focus();
    document.execCommand('paste');
    return hiddenElement.innerHTML;
  } // Check for write access to clipboard, otherwise we're not allowed by the browser to paste in a contenteditable container


  function haveClipboardAccess() {
    return window.clipboardData && window.clipboardData.setData('Text', '');
  }

  function legacyHtmlFromPaste() {
    if (!haveClipboardAccess()) {
      return false;
    }

    var hiddenElement = createHiddenElement();
    var html = getHtmlUsingHiddenElement(hiddenElement);
    removeElement(hiddenElement);
    return html;
  }

  function htmlFromPasteEvent(event) {
    // Modern browsers
    if (event.clipboardData) {
      return event.clipboardData.getData('text/html');
    } else {
      // IE doesn't support event.clipboardData, whereas it's supported by most
      // other major browsers
      return legacyHtmlFromPaste();
    }
  }

  function textFromPasteEvent(event) {
    if (event.clipboardData) {
      return event.clipboardData.getData('text/plain');
    } else if (window.clipboardData) {
      return window.clipboardData.getData('Text');
    }
  }

  function triggerPasteEvent(element, eventName, detail) {
    var params = {
      bubbles: false,
      cancelable: false,
      detail: detail || null
    };
    var event;

    if (typeof window.CustomEvent === 'function') {
      event = new window.CustomEvent(eventName, params);
    } else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent(eventName, params.bubbles, params.cancelable, params.detail);
    }

    element.dispatchEvent(event);
  }

  function pasteListener(event) {
    var element = event.target;
    var html = htmlFromPasteEvent(event);
    triggerPasteEvent(element, 'htmlpaste', html);
    var text = textFromPasteEvent(event);
    triggerPasteEvent(element, 'textpaste', text);

    if (html && html.length) {
      var govspeak = htmlToGovspeak(html);
      triggerPasteEvent(element, 'govspeak', govspeak);
      index(element, govspeak);
      event.preventDefault();
    }
  }

  exports.htmlToGovspeak = htmlToGovspeak;
  exports.pasteListener = pasteListener;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=paste-html-to-markdown.js.map
