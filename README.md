# EmailVerify

A JavaScript email-domain checking tool hosted as a static site on GitHub Pages. It runs in the browser and needs no application server, package dependencies, or API key.

## What it checks

- Basic email syntax and domain-label formatting.
- Domain MX records using Google Public DNS over HTTPS.
- Common disposable domains, free email providers, and role-based local parts.
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
  app.mjs       Browser UI and bulk checks
  index.html    GitHub Pages entry point
  styles.css    App styling
  verify.mjs    Syntax, classification, and DNS lookup logic
test/
  verify.test.mjs
.github/workflows/pages.yml
```

## License

MIT
