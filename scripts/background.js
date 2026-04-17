chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SUMMARIZE_TAB') {
    handleSummarizeRequest(request.tabId, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handleSummarizeRequest(tabId, sendResponse) {
  try {
    // 1. Get text from content script
    const textData = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { action: 'EXTRACT_TEXT' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.text) {
          resolve(response.text);
        } else {
          reject(
            new Error(
              'Could not extract text from this page. Make sure you are on a compatible page like Gmail.'
            )
          );
        }
      });
    });

    if (textData.length < 50) {
      sendResponse({
        success: false,
        error: 'Text is too short to summarize.',
      });
      return;
    }

    // 2. Get Hugging Face API Token
    const storageData = await new Promise((resolve) => {
      chrome.storage.local.get(['hfToken'], resolve);
    });

    if (!storageData.hfToken) {
      sendResponse({
        success: false,
        error:
          'Hugging Face API Token not found. Please click Settings to add it.',
      });
      return;
    }

    // 3. Make the API Call to Hugging Face
    const summary = await callHuggingFaceAPI(textData, storageData.hfToken);

    sendResponse({ success: true, summary: summary });
  } catch (error) {
    console.error('Summarization Error:', error);
    sendResponse({
      success: false,
      error: error.message || 'An unexpected error occurred.',
    });
  }
}

async function callHuggingFaceAPI(text, token) {
  const modelUrl =
    'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

  // Truncate text if too long to prevent model context limits (BART handles roughly ~1024 tokens)
  const truncatedText = text.substring(0, 3000);

  const response = await fetch(modelUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: truncatedText,
      parameters: {
        max_length: 150,
        min_length: 40,
        do_sample: false,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (
      response.status === 503 &&
      errorBody.error &&
      errorBody.error.includes('loading')
    ) {
      throw new Error(
        'Model is currently loading on Hugging Face. Please wait 20 seconds and try again.'
      );
    }
    throw new Error(
      `API Error: ${response.statusText}. ${errorBody.error || ''}`
    );
  }

  const data = await response.json();
  if (data && data[0] && data[0].summary_text) {
    return data[0].summary_text;
  } else {
    throw new Error('Failed to parse summary from API response.');
  }
}
