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
        '<span style="color:#38a169;font-size:12px;">Copied!</span>';
      setTimeout(() => {
        copyBtn.innerHTML = originalSVG;
      }, 2000);
    });
  });

  // Check if we're on Gmail and if API token is configured
  checkReadiness();
});

function checkReadiness() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const desc = document.querySelector('.description');
    if (tabs.length > 0) {
      const url = tabs[0].url || '';
      if (!url.startsWith('https://mail.google.com')) {
        desc.textContent =
          '⚠️ Please navigate to Gmail and open an email first, then click Summarize.';
        desc.style.color = '#f6ad55';
      }
    }
  });

  // Also check if token is set
  chrome.storage.local.get(['hfToken'], (result) => {
    if (!result.hfToken) {
      const desc = document.querySelector('.description');
      desc.innerHTML =
        '🔑 No API token found. Click the <strong>⚙️ gear icon</strong> above to add your Hugging Face token first.';
      desc.style.color = '#fc8181';
    }
  });
}

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

    // Check if we're on a valid page
    if (
      !currentTab.url ||
      currentTab.url.startsWith('chrome://') ||
      currentTab.url.startsWith('chrome-extension://')
    ) {
      showError(
        'Cannot summarize Chrome internal pages. Please navigate to Gmail or a web article.'
      );
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'SUMMARIZE_TAB', tabId: currentTab.id },
      (response) => {
        if (chrome.runtime.lastError) {
          showError(
            'Extension background not responding. Try closing and re-opening the popup.'
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
  return text
    .split('\n')
    .filter((p) => p.trim() !== '')
    .map((p) => `<p style="margin-bottom: 8px;">${p}</p>`)
    .join('');
}
