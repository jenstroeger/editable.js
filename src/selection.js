import $ from 'jquery'

import 'rangy/lib/rangy-textrange'
import Cursor from './cursor'
import * as content from './content'
import * as parser from './parser'
import * as config from './config'
import highlightSupport from './highlight-support'
import highlightText from './highlight-text'

/**
 * The Selection module provides a cross-browser abstraction layer for range
 * and selection.
 *
 * @module core
 * @submodule selection
 */
/**
 * Class that represents a selection and provides functionality to access or
 * modify the selection.
 *
 * @class Selection
 * @constructor
 */

export default class Selection extends Cursor {
  constructor () {
    super(...arguments)
    delete this.isCursor
    this.isSelection = true
  }

  // Get the text inside the selection.
  text () {
    return this.range.toString()
  }

  // Get the html inside the selection.
  html () {
    return this.range.toHtml()
  }

  isAllSelected () {
    return parser.isBeginningOfHost(
      this.host,
      this.range.startContainer,
      this.range.startOffset
    ) && parser.isTextEndOfHost(
      this.host,
      this.range.endContainer,
      this.range.endOffset
    )
  }

  getTextRange () {
    return this.range.toCharacterRange(this.host)
  }

  // Get the ClientRects of this selection.
  // Use this if you want more precision than getBoundingClientRect can give.
  getRects () {
    // consider: translate into absolute positions
    // just like Cursor#getCoordinates()
    return this.range.nativeRange.getClientRects()
  }


  link (href, attrs = {}) {
    const $link = $(this.createElement(config.linkMarkup.name, config.linkMarkup.attribs))
    if (href) attrs.href = href
    $link.attr(attrs)
    this.forceWrap($link[0])
  }

  unlink () {
    this.removeFormatting(config.linkMarkup.name)
  }

  toggleLink (href, attrs) {
    const links = this.getTagsByName(config.linkMarkup.name)
    if (links.length >= 1) {
      const firstLink = links[0]
      if (this.isExactSelection(firstLink, 'visible')) {
        this.unlink()
      } else {
        this.expandTo(firstLink)
      }
    } else {
      this.link(href, attrs)
    }
  }

  // Manually add a highlight
  // Note: the current code does not work with newlines (LP)
  highlight ({highlightId}) {
    const textBefore = this.textBefore()
    const currentTextContent = this.text()

    const marker = '<span class="highlight-comment"></span>'
    const markerNode = highlightSupport.createMarkerNode(marker, this.win)

    markerNode.setAttribute('data-match', currentTextContent)

    const match = {
      startIndex: textBefore.length,
      endIndex: textBefore.length + currentTextContent.length,
      match: currentTextContent,
      marker: markerNode
    }

    // Note: highlighting won't retain the selection
    highlightText.highlightMatches(this.host, [match])
  }

  // toggle('<em>')
  toggle (elem) {
    elem = this.adoptElement(elem)
    this.range = content.toggleTag(this.host, this.range, elem)
    this.setSelection()
  }

  makeBold () {
    const bold = this.createElement(config.boldMarkup.name, config.boldMarkup.attribs)
    this.forceWrap(bold)
  }

  toggleBold () {
    const bold = this.createElement(config.boldMarkup.name, config.boldMarkup.attribs)
    this.toggle(bold)
  }

  giveEmphasis () {
    const em = this.createElement(config.italicMarkup.name, config.italicMarkup.attribs)
    this.forceWrap(em)
  }

  toggleEmphasis () {
    const em = this.createElement(config.italicMarkup.name, config.italicMarkup.attribs)
    this.toggle(em)
  }

  makeUnderline () {
    const u = this.createElement(config.underlineMarkup.name, config.underlineMarkup.attribs)
    this.forceWrap(u)
  }

  toggleUnderline () {
    const u = this.createElement(config.underlineMarkup.name, config.underlineMarkup.attribs)
    this.toggle(u)
  }

  insertCharacter (character) {
    var cursor = this.deleteContent()
    var textNode = cursor.createTextNode(character)
    cursor.insertBefore(textNode)
    cursor.setSelection()
    return cursor
  }

  // Surround the selection with characters like quotes.
  //
  // @param {String} E.g. '«'
  // @param {String} E.g. '»'
  surround (startCharacter, endCharacter) {
    this.range = content.surround(this.host, this.range, startCharacter, endCharacter)
    this.setSelection()
  }

  removeSurround (startCharacter, endCharacter) {
    this.range = content.deleteCharacter(this.host, this.range, startCharacter)
    this.range = content.deleteCharacter(this.host, this.range, endCharacter)
    this.setSelection()
  }

  toggleSurround (startCharacter, endCharacter) {
    if (this.containsString(startCharacter) &&
    this.containsString(endCharacter)) {
      this.removeSurround(startCharacter, endCharacter)
    } else {
      this.surround(startCharacter, endCharacter)
    }
  }

  // @param {String} tagName. E.g. 'a' to remove all links.
  removeFormatting (tagName) {
    this.range = content.removeFormatting(this.host, this.range, tagName)
    this.setSelection()
  }

  // Delete the contents inside the range. After that the selection will be a
  // cursor.
  //
  // @return Cursor instance
  deleteContent () {
    this.range.deleteContents()
    return new Cursor(this.host, this.range)
  }

  // Expand the current selection.
  //
  // @param {DOM Node}
  expandTo (elem) {
    this.range = content.expandTo(this.host, this.range, elem)
    this.setSelection()
  }

  //  Collapse the selection at the beginning of the selection
  //
  //  @return Cursor instance
  collapseAtBeginning (elem) {
    this.range.collapse(true)
    this.setSelection()
    return new Cursor(this.host, this.range)
  }

  //  Collapse the selection at the end of the selection
  //
  //  @return Cursor instance
  collapseAtEnd (elem) {
    this.range.collapse(false)
    this.setSelection()
    return new Cursor(this.host, this.range)
  }

  // Wrap the selection with the specified tag. If any other tag with
  // the same tagName is affecting the selection this tag will be
  // remove first.
  forceWrap (elem) {
    elem = this.adoptElement(elem)
    this.range = content.forceWrap(this.host, this.range, elem)
    this.setSelection()
  }

  // Get all tags that affect the current selection. Optionally pass a
  // method to filter the returned elements.
  //
  // @param {Function filter(node)} [Optional] Method to filter the returned
  //   DOM Nodes.
  // @return {Array of DOM Nodes}
  getTags (filterFunc) {
    return content.getTags(this.host, this.range, filterFunc)
  }

  // Get all tags of the specified type that affect the current selection.
  //
  // @method getTagsByName
  // @param {String} tagName. E.g. 'a' to get all links.
  // @return {Array of DOM Nodes}
  getTagsByName (tagName) {
    return content.getTagsByName(this.host, this.range, tagName)
  }

  // Check if the selection is the same as the elements contents.
  //
  // @method isExactSelection
  // @param {DOM Node}
  // @param {flag:  undefined or 'visible'} if 'visible' is passed
  //   whitespaces at the beginning or end of the selection will
  //   be ignored.
  // @return {Boolean}
  isExactSelection (elem, onlyVisible) {
    return content.isExactSelection(this.range, elem, onlyVisible)
  }

  // Check if the selection contains the passed string.
  //
  // @method containsString
  // @return {Boolean}
  containsString (str) {
    return content.containsString(this.range, str)
  }

  // Delete all occurences of the specified character from the
  // selection.
  deleteCharacter (character) {
    this.range = content.deleteCharacter(this.host, this.range, character)
    this.setSelection()
  }
}
