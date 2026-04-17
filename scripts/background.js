// Background service worker — the controller of the extension.
// Handles communication between popup ↔ content script ↔ Hugging Face API.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SUMMARIZE_TAB') {
    handleSummarizeRequest(request.tabId, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handleSummarizeRequest(tabId, sendResponse) {
  try {
    // ─── Step 1: Ensure the content script is injected ───
    // If the user had Gmail open BEFORE installing the extension,
    // the declarative content_scripts in manifest.json won't be active.
    // We programmatically inject to guarantee the script is there.
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['scripts/content.js'],
      });
    } catch (injectionError) {
      console.warn(
        '[Email Summarizer] Content script injection note:',
        injectionError.message
      );
      // This can fail if the script is already injected (duplicate listener)
      // or if we don't have permission. We continue anyway because the
      // declarative content_scripts might already be active.
    }

    // Small delay to let the injected script register its listener
    await new Promise((resolve) => setTimeout(resolve, 200));

    // ─── Step 2: Request text from the content script ───
    let textData;
    try {
      textData = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          tabId,
          { action: 'EXTRACT_TEXT' },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.text) {
              resolve(response.text);
            } else {
              reject(
                new Error(
                  'Could not extract text. Please open an email in Gmail first, then try again.'
                )
              );
            }
          }
        );
      });
    } catch (messageError) {
      // If messaging fails, it means the content script isn't reachable.
      // Ask the user to refresh.
      sendResponse({
        success: false,
        error:
          'Cannot connect to this page. Please refresh the Gmail tab and try again.',
      });
      return;
    }

    // ─── Step 3: Validate the extracted text ───
    if (!textData || textData.trim().length < 30) {
      sendResponse({
        success: false,
        error:
          'Not enough text found on the page. Please make sure you have an email open (not just the inbox list).',
      });
      return;
    }

    console.log(
      '[Email Summarizer] Extracted',
      textData.length,
      'characters from tab',
      tabId
    );

    // ─── Step 4: Retrieve the API token ───
    const storageData = await new Promise((resolve) => {
      chrome.storage.local.get(['hfToken'], resolve);
    });

    if (!storageData.hfToken) {
      sendResponse({
        success: false,
        error:
          'API Token not found. Click the ⚙️ Settings icon in the top-right to add your Hugging Face token.',
      });
      return;
    }

    // ─── Step 5: Call the Hugging Face Summarization API ───
    const summary = await callHuggingFaceAPI(
      textData,
      storageData.hfToken.trim()
    );

    sendResponse({ success: true, summary: summary });
  } catch (error) {
    console.error('[Email Summarizer] Error:', error);
    sendResponse({
      success: false,
      error: error.message || 'An unexpected error occurred.',
    });
  }
}

async function callHuggingFaceAPI(text, token) {
  const modelUrl =
    'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

  // BART-large-CNN handles ~1024 tokens which is roughly 3000-4000 chars.
  // Truncate to a safe limit.
  const truncatedText = text.substring(0, 4000);

  let response;
  try {
    response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: truncatedText,
        parameters: {
          max_length: 150,
          min_length: 30,
          do_sample: false,
        },
        options: {
          wait_for_model: true, // Wait up to ~2 mins for model to load instead of giving 503
        },
      }),
    });
  } catch (networkError) {
    throw new Error(
      'Network error: Could not reach Hugging Face servers. Check your internet connection.'
    );
  }

  // ─── Handle HTTP errors with user-friendly messages ───
  if (!response.ok) {
    let errorBody = {};
    try {
      errorBody = await response.json();
    } catch {
      // Response wasn't JSON
    }

    const hfError = errorBody.error || '';

    switch (response.status) {
      case 401:
        throw new Error(
          'Invalid API token. Please go to Settings and paste a valid Hugging Face Access Token (starts with "hf_").'
        );
      case 403:
        throw new Error(
          'Access denied. Your token may not have the required permissions. Generate a new token with "Read" access at huggingface.co/settings/tokens.'
        );
      case 429:
        throw new Error(
          'Rate limit reached. Hugging Face free tier has usage limits. Please wait a minute and try again.'
        );
      case 503:
        if (hfError.includes('loading')) {
          throw new Error(
            'The AI model is warming up on Hugging Face servers. This takes ~20 seconds for free-tier. Please try again shortly.'
          );
        }
        throw new Error(
          'Hugging Face service is temporarily unavailable. Please try again in a moment.'
        );
      default:
        throw new Error(
          `Hugging Face API Error (${response.status}): ${hfError || response.statusText}`
        );
    }
  }

  // ─── Parse the successful response ───
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      'Received an unexpected response format from Hugging Face.'
    );
  }

  if (Array.isArray(data) && data[0] && data[0].summary_text) {
    return data[0].summary_text;
  } else if (data.error) {
    throw new Error(`Hugging Face: ${data.error}`);
  } else {
    console.error('[Email Summarizer] Unexpected API response:', data);
    throw new Error(
      'Could not parse summarization result. The API response format was unexpected.'
    );
  }
}
