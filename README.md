# ✨ Smart Email Summarizer — Chrome Extension

A sleek, production-quality Chrome Extension that instantly summarizes long emails in Gmail using AI-powered NLP models. Built with the **Hugging Face Inference API** (`facebook/bart-large-cnn`) for abstractive summarization, wrapped in a premium glassmorphism UI.

> _Inspired by Google's Gemini integration in Gmail — but open-source and self-hosted._

---

## 🚀 Features

- **One-Click Summarization** — Open any Gmail thread, click the extension, get an instant summary.
- **Hugging Face Integration** — Leverages pre-trained BART-large-CNN for high-quality abstractive summaries.
- **Premium UI/UX** — Dark glassmorphism design with micro-animations, responsive states, and copy-to-clipboard.
- **Smart Text Extraction** — Multi-strategy DOM parsing to reliably extract email content from Gmail's complex layout.
- **Secure Token Storage** — API token stored locally in Chrome's storage, never sent anywhere except Hugging Face.
- **Modern DevOps** — Automated CI pipeline with GitHub Actions enforcing ESLint + Prettier on every push.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Chrome Browser                │
│                                                 │
│  ┌──────────┐    ┌──────────────┐               │
│  │  Popup   │───▶│  Background  │               │
│  │ (popup/) │◀───│  Service     │               │
│  │          │    │  Worker      │               │
│  └──────────┘    │  (scripts/   │               │
│                  │   background │               │
│  ┌──────────┐    │   .js)       │               │
│  │ Options  │    └──────┬───────┘               │
│  │(options/)│           │                       │
│  └──────────┘     ┌─────┴─────┐                 │
│                   │           │                 │
│            ┌──────▼──┐  ┌─────▼──────────┐      │
│            │ Content  │  │ Hugging Face   │      │
│            │ Script   │  │ Inference API  │      │
│            │(Gmail    │  │ (BART-large-   │      │
│            │ DOM)     │  │  CNN model)    │      │
│            └──────────┘  └───────────────┘      │
└─────────────────────────────────────────────────┘
```

**Data Flow:** Popup → Background Worker → Content Script (extracts text) → Background Worker → Hugging Face API → Background Worker → Popup (displays summary)

---

## 🛠️ Tech Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | Vanilla HTML / CSS / JS (Manifest V3)       |
| AI / NLP | Hugging Face Inference API (BART-large-CNN) |
| DevOps   | GitHub Actions CI, ESLint, Prettier         |
| Design   | Glassmorphism, CSS Custom Properties, Inter |

---

## 📦 How to Install

1. **Clone** this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/smart-email-summarizer.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right).
4. Click **Load unpacked** and select the cloned project folder.
5. Click the extension icon → **⚙️ Settings** → paste your [Hugging Face Access Token](https://huggingface.co/settings/tokens) (needs **Read** permission).
6. Open Gmail → open an email → click the extension → **Summarize Email** 🎉

---

## 🧠 Key Learnings

- **API-Driven AI Integration** — Learned to orchestrate cloud-hosted pre-trained NLP models via REST APIs instead of building & training from scratch.
- **Chrome Extension Architecture (MV3)** — Mastered the interaction between Service Workers, Content Scripts, and Popup UIs in Manifest V3.
- **Robust DOM Parsing** — Built multi-strategy extraction to handle Gmail's complex, obfuscated DOM with graceful fallbacks.
- **CI/CD Automation** — Implemented GitHub Actions pipelines for automated linting and formatting on every push.

---

## 📁 Project Structure

```
├── .github/workflows/ci.yml   # GitHub Actions CI pipeline
├── manifest.json               # Chrome Extension configuration (MV3)
├── popup/
│   ├── popup.html              # Extension popup UI
│   ├── popup.css               # Glassmorphism dark-mode styles
│   └── popup.js                # Popup logic & state management
├── options/
│   ├── options.html            # Settings page
│   ├── options.css             # Settings page styles
│   └── options.js              # Token save/restore logic
├── scripts/
│   ├── background.js           # Service worker (API calls, orchestration)
│   └── content.js              # Gmail DOM text extraction
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
└── package.json                # Dev dependencies & scripts
```

---

## 📜 License

MIT © Ammar
