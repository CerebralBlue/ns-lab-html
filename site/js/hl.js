
function ntlHighlighting() {
  hljs.registerLanguage("ntl", function(hljs) {
    return {
      name: 'ntl',
      contains: [
        // Inline Variable `<< ... >>` that can appear anywhere
        {
          className: 'inline-variable',
          begin: /<</, end: />>/,
          contains: [
            {
              className: 'variable',
              begin: /\b[a-zA-Z_\-0-9\[\].]+\b/ // Identifiers inside << >>
            },
            {
              className: 'string',
              begin: /"/, end: /"/, // Strings within << >>
              contains: [
                {
                  className: 'escape',
                  begin: /\\./ // Escape sequences inside strings
                }
              ]
            },
            {
              className: 'property',
              begin: /\b[a-zA-Z_\-0-9\[\].]+\s*:/,
              end: /(?=\s*[,|}])/,
              excludeEnd: true,
              contains: [
                {
                  className: 'string',
                  begin: /"/, end: /"/
                },
                {
                  className: 'number',
                  begin: /\b\d+(\.\d+)?\b/
                },
                {
                  className: 'literal',
                  begin: /\b(true|false|null)\b/
                }
              ]
            }
          ]
        },
  
        // Template Variable `{{ ... }}` that contains other elements
        {
          className: 'template-variable',
          begin: /\{\{/, end: /\}\}/,
          contains: [
            {
              className: 'variable',
              begin: /\b[a-zA-Z_\-0-9\[\].]+\b/
            },
            {
              className: 'string',
              begin: /"/, end: /"/,
              contains: [
                {
                  className: 'escape',
                  begin: /\\./
                }
              ]
            },
            {
              className: 'operator',
              begin: /=>/
            },
            {
              className: 'property',
              begin: /\b[a-zA-Z_\-0-9\[\].]+\s*:/,
              end: /(?=\s*[,|}])/,
              excludeEnd: true,
              contains: [
                {
                  className: 'string',
                  begin: /"/, end: /"/
                },
                {
                  className: 'number',
                  begin: /\b\d+(\.\d+)?\b/
                },
                {
                  className: 'literal',
                  begin: /\b(true|false|null)\b/
                },
                // Inline Variable within properties in template
                {
                  className: 'inline-variable',
                  begin: /<</, end: />>/,
                  contains: [
                    {
                      className: 'variable',
                      begin: /\b[a-zA-Z_\-0-9\[\].]+\b/
                    },
                    {
                      className: 'string',
                      begin: /"/, end: /"/,
                      contains: [
                        {
                          className: 'escape',
                          begin: /\\./
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
  
        // Identifiers outside of `{{ ... }}` and `<< ... >>`
        {
          className: 'non-template-variable',
          begin: /\b[a-zA-Z_\-0-9\[\].]+\b/,
          relevance: 0
        },
  
        // Boolean literals (true, false)
        {
          className: 'literal',
          begin: /\b(true|false)\b/
        },
  
        // Numbers (Number literals)
        {
          className: 'number',
          begin: /\b[0-9.]+\b/
        },
  
        // General strings outside of template or inline variables
        {
          className: 'string',
          begin: /"/, end: /"/,
          contains: [
            {
              className: 'escape', // Handles escaped characters within strings
              begin: /\\./
            }
          ]
        },
  
        // Property Definition (outside template variables)
        {
          className: 'property',
          begin: /\b[a-zA-Z_\-0-9\[\].]+\s*:/,
          end: /(?=\s*[,|}])/,
          excludeEnd: true,
          contains: [
            {
              className: 'string',
              begin: /"/, end: /"/
            },
            {
              className: 'number',
              begin: /\b\d+(\.\d+)?\b/
            },
            {
              className: 'literal',
              begin: /\b(true|false|null)\b/
            },
            // Inline Variable within properties outside of template
            {
              className: 'inline-variable',
              begin: /<</, end: />>/,
              contains: [
                {
                  className: 'variable',
                  begin: /\b[a-zA-Z_\-0-9\[\].]+\b/
                },
                {
                  className: 'string',
                  begin: /"/, end: /"/,
                  contains: [
                    {
                      className: 'escape',
                      begin: /\\./
                    }
                  ]
                }
              ]
            }
          ]
        },
  
        // Chain operator `=>`
        {
          className: 'operator',
          begin: /=>/
        },
  
        // PropDivider `|`
        {
          className: 'punctuation',
          begin: /\|/
        },
  
        // Comma `,`
        {
          className: 'punctuation',
          begin: /,/
        }
      ]
    };
  });
  
}

function initHighlighting() {
  document.querySelectorAll('div pre code').forEach(function ($) {
    console.log($);
    let p = $.parentElement.parentElement;
    if (p && p.className.includes('language')) {
      let cs = p.className.split(' ');
      for (let s of cs) {
        if (s.includes('language')) {
          if (s == 'language-text')
            s = 'language-plaintext';

          $.className = s;
          break;
        }
      }
    }
    if (!$.className)
      $.className = 'no-highlight';
  });
  ntlHighlighting();
  hljs.highlightAll();
}