import $ from 'jquery'

import Editable from '../src/core'
import Highlighting from '../src/highlighting'
import WordHighlighter from '../src/plugins/highlighting/text-highlighting'


describe('Highlighting', function () {

  // Specs

  beforeEach(() => {
    this.editable = new Editable()
  })

  describe('new Highlighting()', () => {

    it('creates an instance with a reference to editable', () => {
      const highlighting = new Highlighting(this.editable, {})
      expect(highlighting.editable).toEqual(this.editable)
    })

  })

  describe('WordHighlighter', () => {

    beforeEach(() => {
      const markerNode = $('<span class="highlight"></span>')[0]
      this.highlighter = new WordHighlighter(markerNode)
    })

    it('finds the word "a"', () => {
      const text = 'a'
      const matches = this.highlighter.findMatches(text, ['a'])

      const firstMatch = matches[0]
      expect(firstMatch.match).toEqual('a')
      expect(firstMatch.startIndex).toEqual(0)
      expect(firstMatch.endIndex).toEqual(1)
    })

    it('does not find the word "b"', () => {
      const text = 'a'
      const matches = this.highlighter.findMatches(text, ['b'])
      expect(matches.length).toEqual(0)
    })

    it('finds the word "juice"', () => {
      const text = 'Some juice.'
      const matches = this.highlighter.findMatches(text, ['juice'])
      const firstMatch = matches[0]
      expect(firstMatch.match).toEqual('juice')
      expect(firstMatch.startIndex).toEqual(5)
      expect(firstMatch.endIndex).toEqual(10)
    })
  })

  describe('highlightSupport', () => {

    beforeEach(() => {
      this.$div = $('<div>Foobarista</div>').appendTo(document.body)
      this.editable = new Editable()
      this.editable.add(this.$div)
    })

    afterEach(() => {
      this.$div.remove()
      this.editable.off()
      this.editable = undefined
    })

    it('can highlight text range matches', () => {
      const startIndex = this.editable.highlight({
        editableHost: this.$div[0],
        text: 'bari',
        highlightId: 'myId',
        textRange: {start: 3, end: 7}
      })
      const highlightSpan = this.$div.find('[data-word-id="myId"]')
      expect(highlightSpan.length).toEqual(1)
      expect(highlightSpan.text()).toEqual('bari')
      expect(startIndex).toEqual(3)
    })

    it('skips if a highlight with the given id is already present', () => {
      this.editable.highlight({
        editableHost: this.$div[0],
        text: 'bari',
        highlightId: 'myId',
        textRange: {start: 3, end: 7}
      })
      this.editable.highlight({
        editableHost: this.$div[0],
        text: 'Foobari',
        highlightId: 'myId',
        textRange: {start: 0, end: 7}
      })
      const highlightSpan = this.$div.find('[data-word-id="myId"]')
      expect(highlightSpan.length).toEqual(1)
      expect(highlightSpan.text()).toEqual('bari')
    })

    it('skips if an invalid range object was passed', () => {
      this.editable.highlight({
        editableHost: this.$div[0],
        text: 'bari',
        highlightId: 'myId',
        textRange: {foo: 3, bar: 7}
      })
      const highlightSpan = this.$div.find('[data-word-id="myId"]')
      expect(highlightSpan.length).toEqual(0)
    })
  })

})
