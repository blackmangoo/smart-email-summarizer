# ✨ Smart Email Summarizer (Chrome Extension)

A beautiful, sleek Chrome Extension built to instantly summarize long emails (targeting Gmail) using advanced NLP models. Instead of building from scratch, this project harnesses the power of the **Hugging Face Inference API** (`facebook/bart-large-cnn`) to provide highly accurate summaries, packaged in a premium user interface.

## 🚀 Features

- **One-Click Summarization**: Click the extension on any Gmail thread and get an instant summary.
- **Hugging Face Integration**: Uses pre-trained abstractive summarization models.
- **Premium UI/UX**: Features glassmorphism, smooth micro-animations, and a responsive dark mode.
- **Secure Token Storage**: Safely save your API token using Chrome's local storage.
- **Modern DevOps workflows**: Automated CI pipeline using GitHub Actions to enforce ESLint and Prettier standards.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (Manifest V3 Chrome Extension)
- **AI/ML**: Hugging Face Inference API
- **DevOps**: GitHub Actions (CI/CD), ESLint, Prettier

## 🧠 Key Learnings

- **API-Driven AI**: Learned how to effectively integrate and orchestrate cloud-hosted pre-trained NLP models (Hugging Face) without needing heavy local backend ML processing.
- **Chrome Extension Architecture**: Mastered the interactions between Manifest V3 Service Workers (`background.js`), content injection (`content.js`), and frontend popups.
- **DOM Parsing Strategy**: Developed reliable methods for interacting with complex third-party DOM structures (like Gmail) to extract clean text.
- **CI/CD Integration**: Implemented basic DevOps by setting up automated code linting and formatting via GitHub Actions.

## 📦 How to Install

1. Clone this repository.
2. Go to `chrome://extensions/` in your Chrome browser.
3. Toggle on **Developer mode** in the top right.
4. Click **Load unpacked** and select the project folder.
5. Click on the extension icon > **Settings** (gear icon) and add your Hugging Face API Token.
6. Open an email in Gmail, click the extension, and summarize!
