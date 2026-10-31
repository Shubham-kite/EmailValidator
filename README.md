# EmailVerify

A JavaScript email-domain checking tool hosted as a static site on GitHub Pages. It runs in the browser and needs no application server, package dependencies, or API key.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://shubham-kite.github.io/EmailValidator/)
[![Motion Video Presentation](https://img.shields.io/badge/🎬-Motion_Video-orange)](https://shubham-kite.github.io/EmailValidator/motion-video.html)

## 🎬 Motion Video & Demo Presentation

Watch the interactive animated presentation and review the video production script:
- **[Interactive Motion Video Player](https://shubham-kite.github.io/EmailValidator/motion-video.html)** (Hosted live on GitHub Pages)
- **[Video Storyboard & Script](video-storyboard.md)** (Scene-by-scene script and voiceover breakdown)

## What it checks

- Basic email syntax and domain-label formatting.
- Domain MX records using Google Public DNS over HTTPS.
- Common disposable domains, free email providers, and role-based local parts.
- A visible risk indicator (`high`, `medium`, `low`, or `unknown`) with the reasons included in the UI and JSON result.
- Single addresses and batches of up to 50.

An MX record only shows that a domain advertises mail servers. **It does not confirm that an individual mailbox exists or that a message will be delivered.** Browser-only GitHub Pages cannot connect to SMTP servers on port 25. BriteVerify also requires a private API key and must not be called directly from a public browser app. These checks are clearly identified as unavailable in the results.

DNS requests send the domain name (not the full email address) to Google Public DNS. The app does not save checked addresses after the page is closed.

## Live site

After the GitHub Pages workflow succeeds, the site is available at:

<https://shubham-kite.github.io/EmailValidator/>

## Deploy on GitHub Pages

The `Deploy GitHub Pages` workflow publishes the `site/` folder whenever a commit is pushed to `main`.

1. In the GitHub repository, open **Settings → Pages**.
2. Set the build and deployment source to **GitHub Actions** if it is not already selected.
3. Push to `main` or run **Actions → Deploy GitHub Pages → Run workflow**.
4. Open the Pages URL above after the workflow finishes.

## Run and test locally

Open `site/index.html` using a local static web server, or use GitHub Pages after deployment. DNS-over-HTTPS checks require an internet connection.

Run the built-in Node.js tests (Node 20 or newer):

```bash
npm test
```

## Project structure

```text
site/
  app.mjs         Browser UI and bulk checks
  index.html      GitHub Pages entry point
  motion-video.html Interactive motion video presentation player
  styles.css      App styling
  verify.mjs      Syntax, classification, and DNS lookup logic
test/
  verify.test.mjs
.github/workflows/pages.yml
```

## License

MIT
