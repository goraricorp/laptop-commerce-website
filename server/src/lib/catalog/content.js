import sanitizeHtml from 'sanitize-html'
// Explicit formats; legacy/unmarked content is always rendered as text.
export function cleanContent(section) {
  if (section.format !== 'html') return { ...section, format: 'plain' }
  return {
    ...section,
    content: sanitizeHtml(section.content ?? '', {
      allowedTags: [
        'p',
        'br',
        'strong',
        'b',
        'em',
        'i',
        'u',
        's',
        'h2',
        'h3',
        'h4',
        'ul',
        'ol',
        'li',
        'blockquote',
        'pre',
        'code',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'a',
      ],
      allowedAttributes: {
        a: ['href', 'title'],
        td: ['colspan', 'rowspan'],
        th: ['colspan', 'rowspan'],
      },
      allowedSchemes: ['https', 'http'],
      allowProtocolRelative: false,
      disallowedTagsMode: 'discard',
    }),
  }
}
