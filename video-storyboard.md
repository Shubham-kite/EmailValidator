# EmailVerify — Motion Video Storyboard & Production Script

**Repository:** [Shubham-kite/EmailValidator](https://github.com/Shubham-kite/EmailValidator)  
**Live Demo:** [https://shubham-kite.github.io/EmailValidator/](https://shubham-kite.github.io/EmailValidator/)  
**Duration:** ~60 seconds  
**Tone:** Sleek, Developer-focused, Fast-paced, Postman/GitHub dark-mode aesthetic.

---

## Scene Breakdown & Script

### Scene 1: The Hook (0:00 - 0:10)
* **Visual:** Dark-mode screen showing GitHub repo `Shubham-kite/EmailValidator`. Transition to a sleek Postman-like web interface.
* **On-Screen Text:** *Verify Emails Instantly. Zero Backend. Zero API Keys.*
* **Voiceover / Narration:** 
  > "Need to verify email addresses without setting up complex servers, maintaining databases, or paying for expensive API keys? Meet **EmailVerify**—a lightning-fast, 100% browser-based email domain checker hosted right on GitHub Pages."

---

### Scene 2: Core Architecture & Privacy (0:10 - 0:25)
* **Visual:** Split screen showing code architecture (`site/verify.mjs`, `site/app.mjs`) and a secure DNS query visualization (`Google Public DNS over HTTPS`).
* **On-Screen Text:** *Client-Side Architecture • Google DoH • Total Privacy*
* **Voiceover / Narration:**
  > "Built entirely in vanilla JavaScript, EmailVerify runs completely in your browser. It performs robust syntax validation and checks domain MX records securely using Google Public DNS over HTTPS—ensuring domain queries are anonymous and no email data is ever stored after you close the tab."

---

### Scene 3: Deep Feature Demo (0:25 - 0:45)
* **Visual:** Typing an email address (`sasha.mogensen@boatyard.com`) into the UI. Real-time verification results appearing with risk indicators (`high`, `medium`, `low`), syntax check, and MX server records. Then switching to bulk verification mode (testing up to 50 addresses at once).
* **On-Screen Text:** *Syntax Validation • MX Records • Risk Scoring • Bulk Checking (up to 50)*
* **Voiceover / Narration:**
  > "Type a single address or paste a batch of up to fifty emails. The tool instantly flags disposable mailboxes, free webmail providers, and role accounts, generating a clear risk score and detailed diagnostic breakdown."

---

### Scene 4: Design Philosophy & Limitations (0:45 - 0:50)
* **Visual:** Clean tooltip or info callout highlighting security boundaries: *Why no browser SMTP port 25 or client-side BriteVerify API keys?*
* **On-Screen Text:** *Secure & Transparent*
* **Voiceover / Narration:**
  > "Unlike tools that expose private API keys in frontend code or fail due to browser port 25 restrictions, EmailVerify maintains complete transparency about what browser-only static apps can and cannot do."

---

### Scene 5: Live GitHub Pages & Deployment (0:50 - 1:00)
* **Visual:** GitHub Actions workflow badge turning green, followed by the live site URL: `https://shubham-kite.github.io/EmailValidator/`.
* **On-Screen Text:** *Deployed via GitHub Actions • Open Source MIT*
* **Voiceover / Narration:**
  > "Automated with GitHub Actions and published instantly to GitHub Pages, it's open-source, MIT licensed, and ready to deploy in seconds. Check out the live demo today at shubham-kite.github.io/EmailValidator!"
