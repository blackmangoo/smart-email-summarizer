// This script runs in the context of the web page (Gmail).

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_TEXT') {
    const text = extractGmailContent();
    sendResponse({ text: text });
  }
  return true; // Keep the message channel open for async response
});

function extractGmailContent() {
  // Gmail uses specific classes for the email body.
  // .a3s.aiL is commonly used for the expanded email body.
  const emailBodies = document.querySelectorAll('.a3s.aiL');

  if (emailBodies.length > 0) {
    // There might be multiple in a thread, usually the last one is the one we want.
    // Let's grab the last visible one or combine them if needed.
    // Here we'll grab the last one in the DOM, which is usually the most recent reply.
    const lastEmail = emailBodies[emailBodies.length - 1];
    let rawText = lastEmail.innerText || lastEmail.textContent;
    return cleanText(rawText);
  }

  // Fallback: if not found by class, try grabbing all paragraphs in the main role
  const mainDiv = document.querySelector('div[role="main"]');
  if (mainDiv) {
    return cleanText(mainDiv.innerText);
  }

  // Absolute fallback: just grab document body text (might contain noise)
  return cleanText(document.body.innerText);
}

function cleanText(text) {
  // Remove excessive newlines and whitespace
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
