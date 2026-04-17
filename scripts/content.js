// Content script — runs inside the Gmail page context.
// Listens for extraction requests from the background service worker.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_TEXT') {
    try {
      const text = extractGmailContent();
      console.log(
        '[Email Summarizer] Extracted text length:',
        text.length,
        '| Preview:',
        text.substring(0, 120)
      );
      sendResponse({ text: text });
    } catch (err) {
      console.error('[Email Summarizer] Extraction error:', err);
      sendResponse({ text: '', error: err.message });
    }
  }
  return true;
});

function extractGmailContent() {
  // Strategy 1: Look for the open/expanded email body.
  // Gmail wraps each message body in a div with class "a3s" (sometimes also "aiL").
  // We try multiple selectors from most-specific to least-specific.

  const selectors = [
    '.a3s.aiL', // expanded email body (most common)
    '.a3s', // email body without aiL flag
    'div.ii.gt', // another common Gmail message body wrapper
    'div[data-message-id] .a3s', // message-specific body
  ];

  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Combine ALL visible email bodies in the thread (not just the last one)
      const allTexts = [];
      elements.forEach((el) => {
        // Skip collapsed/hidden messages
        if (el.offsetHeight > 0 && el.offsetWidth > 0) {
          const text = el.innerText || el.textContent || '';
          if (text.trim().length > 10) {
            allTexts.push(text.trim());
          }
        }
      });

      // If we found visible bodies, also try the last one even if hidden
      // (sometimes Gmail hides expanded content behind a "show trimmed" button)
      if (allTexts.length === 0) {
        const lastEl = elements[elements.length - 1];
        const text = lastEl.innerText || lastEl.textContent || '';
        if (text.trim().length > 10) {
          allTexts.push(text.trim());
        }
      }

      if (allTexts.length > 0) {
        return cleanText(allTexts.join('\n\n---\n\n'));
      }
    }
  }

  // Strategy 2: Look for the email subject + thread pane
  const threadPane = document.querySelector('div[role="list"]');
  if (threadPane) {
    const text = threadPane.innerText || '';
    if (text.trim().length > 30) {
      return cleanText(text);
    }
  }

  // Strategy 3: Look for the main content area
  const mainDiv = document.querySelector('div[role="main"]');
  if (mainDiv) {
    const text = mainDiv.innerText || '';
    if (text.trim().length > 30) {
      return cleanText(text);
    }
  }

  // Strategy 4: If we're not on Gmail, just grab all readable text from the page
  // This makes the extension work on articles/blogs too
  const article = document.querySelector('article');
  if (article) {
    return cleanText(article.innerText);
  }

  // Final fallback: grab body text, but filter out very short results
  const bodyText = document.body.innerText || '';
  return cleanText(bodyText);
}

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\t+/g, ' ')
    .replace(/ {3,}/g, ' ')
    .trim();
}
