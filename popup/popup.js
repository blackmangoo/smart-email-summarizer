document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const summarizeBtn = document.getElementById('summarize-btn');
  const copyBtn = document.getElementById('copy-btn');
  const retryBtn = document.getElementById('retry-btn');

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  summarizeBtn.addEventListener('click', startSummarization);
  retryBtn.addEventListener('click', startSummarization);

  copyBtn.addEventListener('click', () => {
    const text = document.getElementById('summary-content').innerText;
    navigator.clipboard.writeText(text).then(() => {
      const originalSVG = copyBtn.innerHTML;
      copyBtn.innerHTML =
        '<span style="color:var(--success);font-size:12px;">Copied!</span>';
      setTimeout(() => {
        copyBtn.innerHTML = originalSVG;
      }, 2000);
    });
  });
});

function switchState(stateId) {
  document
    .querySelectorAll('.state-view')
    .forEach((el) => el.classList.remove('active'));
  document.getElementById(stateId).classList.add('active');
}

function startSummarization() {
  switchState('loading-state');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      showError('No active tab found.');
      return;
    }

    const currentTab = tabs[0];

    // First, tell background to handle everything (send message to background, which injects content script and calls API)
    chrome.runtime.sendMessage(
      { action: 'SUMMARIZE_TAB', tabId: currentTab.id },
      (response) => {
        if (chrome.runtime.lastError) {
          showError(
            'Could not connect to the extension background. Please refresh the page.'
          );
          return;
        }

        if (response && response.success) {
          document.getElementById('summary-content').innerHTML = formatSummary(
            response.summary
          );
          switchState('result-state');
        } else {
          showError(response ? response.error : 'Unknown error occurred.');
        }
      }
    );
  });
}

function showError(message) {
  document.getElementById('error-message').textContent = message;
  switchState('error-state');
}

function formatSummary(text) {
  // Simple formatting: turn newlines into paragraphs
  return text
    .split('\n')
    .filter((p) => p.trim() !== '')
    .map((p) => `<p style="margin-bottom: 8px;">${p}</p>`)
    .join('');
}
