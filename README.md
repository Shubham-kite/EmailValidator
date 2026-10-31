# EmailVerify Pro — Advanced Email Verification API & BriteVerify Client

A comprehensive, production-grade email verification tool built with **FastAPI**, a modern **Postman-inspired Web UI**, and integration with **BriteVerify API**. This tool performs deep email validation including syntax checking, DNS/MX record lookup, BriteVerify verification checks, disposable email blacklist detection, free email provider checks, role account identification, and live SMTP mailbox existence pinging.

---

## Features

- **BriteVerify API Integration**: Seamlessly queries `bpi.briteverify.com` using your API key for enterprise-grade email validation status and reasons.
- **Syntax Validation**: Validates email format against strict RFC 5322 standards.
- **MX Record DNS Lookup**: Queries domain name servers to verify active Mail Exchange (MX) servers.
- **Disposable Email Detection**: Automatically flags temporary and disposable email providers (e.g., Mailinator, TempMail).
- **Free Webmail & Role Detection**: Identifies free webmail providers (Gmail, Yahoo, Outlook) and role-based accounts (`admin@`, `support@`, `sales@`).
- **SMTP Mailbox Handshake**: Pings the destination mail server to check if the specific mailbox exists.
- **Postman-Inspired Interactive UI**: A sleek, dark-mode developer workspace featuring request builders, JSON payload editors, response timers, status codes, and visual breakdown cards.

---

## Project Structure

```text
Email Verification/
├── main.py              # FastAPI backend engine & BriteVerify integration
├── requirements.txt     # Python dependencies
├── test_verify.py       # Automated unit tests for verification logic
├── .gitignore           # Git ignore rules
├── README.md            # Project documentation
├── render.yaml          # Render deployment configuration
├── .env.example         # Environment variable template
└── static/
    └── index.html       # Postman-like web client interface
```

---

## Installation & Quickstart

### 1. Prerequisites
- Python 3.8+ installed on your system.

### 2. Install Dependencies
Clone or download this repository, navigate to the project directory, and install the required packages:

```bash
pip install -r requirements.txt
```

### 3. Configure BriteVerify (optional)
Set `BRITEVERIFY_API_KEY` in your environment to enable the BriteVerify integration. If it is unset, local checks continue to work and the API response explains that the integration is not configured.

For local development, set the variable in your shell before starting the app. In PowerShell, use `$env:BRITEVERIFY_API_KEY = "your-key"`; in bash, use `export BRITEVERIFY_API_KEY="your-key"`. `.env.example` is a variable template only; the app does not load `.env` files automatically. Do not commit `.env` or put API keys in source code.

### 4. Run the Application
Start the FastAPI backend server:

```bash
python main.py
```

The server will start at `http://localhost:8000`.

### 5. Open the Postman-Like Client
Open your browser and navigate to:
```
http://localhost:8000
```
Use the interactive UI to test single or bulk email verifications (including preset tests like `sasha.mogensen@boatyard.com`), view JSON responses, and inspect BriteVerify and SMTP diagnostics.

---

## API Endpoints

### `POST /api/verify`
Verify a single email address with BriteVerify and local checks.

**Request Body (JSON):**
```json
{
  "email": "sasha.mogensen@boatyard.com",
  "check_smtp": true,
  "use_briteverify": true
}
```

**Response Example:**
```json
{
  "email": "sasha.mogensen@boatyard.com",
  "syntax": { "valid": true, "reason": "Syntax is valid." },
  "domain": {
    "name": "boatyard.com",
    "has_mx": true,
    "mx_records": ["aspmx.l.google.com"]
  },
  "classification": {
    "is_disposable": false,
    "is_free": false,
    "is_role": false
  },
  "smtp": {
    "success": true,
    "code": 250,
    "message": "OK"
  },
  "briteverify": {
    "enabled": true,
    "success": true,
    "data": {
      "address": "sasha.mogensen@boatyard.com",
      "status": "valid",
      "account": "sasha.mogensen",
      "domain": "boatyard.com",
      "connected": "true",
      "disposable": "false",
      "role_address": "false"
    }
  },
  "score": 95,
  "status": "deliverable",
  "responseTimeMs": 312.4
}
```

---

## Deploying to Render

This repository includes a Render Blueprint in `render.yaml`. Create a new Blueprint from the GitHub repository and set `BRITEVERIFY_API_KEY` in the Render service's environment settings if you want BriteVerify enabled. The web UI automatically uses the deployed site's URL.

The service runs with:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

SMTP checks may be unavailable on hosting providers that restrict outbound connections on port 25.

## Publishing to GitHub

The project repository is [Shubham-kite/EmailValidator](https://github.com/Shubham-kite/EmailValidator). Never commit API keys; configure them as environment variables in the deployment provider instead.

---

## License
MIT License
