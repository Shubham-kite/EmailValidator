import os
import re
import socket
import smtplib
import dns.resolver
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import time

app = FastAPI(
    title="Email Verification API (Postman Edition + BriteVerify)",
    description="Comprehensive Email Verification Tool with Postman-like API, Local Checks, and BriteVerify Integration",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Common disposable email domains
DISPOSABLE_DOMAINS = {
    "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
    "throwawaymail.com", "yopmail.com", "sharklasers.com", "getairmail.com",
    "dispostable.com", "trashmail.com", "maildrop.cc", "temp-mail.org",
    "fakemailgenerator.com", "getnada.com", "mohmal.com", "emailondeck.com"
}

# Common free webmail providers
FREE_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
    "aol.com", "zoho.com", "proton.me", "protonmail.com", "gmx.com", "mail.com"
}

# Common role account prefixes
ROLE_PREFIXES = {
    "admin", "administrator", "support", "sales", "info", "contact",
    "office", "billing", "help", "hr", "jobs", "media", "press", "team",
    "security", "privacy", "compliance", "abuse", "postmaster", "hostmaster"
}

BRITEVERIFY_API_KEY = os.getenv("BRITEVERIFY_API_KEY")

class EmailRequest(BaseModel):
    email: str
    check_smtp: Optional[bool] = True
    use_briteverify: Optional[bool] = True

class BulkEmailRequest(BaseModel):
    emails: List[str]
    check_smtp: Optional[bool] = False
    use_briteverify: Optional[bool] = True

def verify_email_logic(email: str, check_smtp: bool = True, use_briteverify: bool = True) -> dict:
    start_time = time.time()
    result = {
        "email": email,
        "syntax": {"valid": False, "reason": ""},
        "domain": {"name": "", "has_mx": False, "mx_records": []},
        "classification": {
            "is_disposable": False,
            "is_free": False,
            "is_role": False
        },
        "smtp": {"success": False, "code": 0, "message": ""},
        "briteverify": {"enabled": use_briteverify, "success": False, "data": None, "error": None},
        "score": 0,
        "status": "invalid",
        "responseTimeMs": 0
    }

    # 1. Syntax Check
    email_regex = r"^([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)$"
    match = re.match(email_regex, email)
    if not match:
        result["syntax"]["valid"] = False
        result["syntax"]["reason"] = "Invalid email syntax format."
        result["responseTimeMs"] = round((time.time() - start_time) * 1000, 2)
        return result

    result["syntax"]["valid"] = True
    result["syntax"]["reason"] = "Syntax is valid."
    local_part, domain = match.groups()
    result["domain"]["name"] = domain

    # 2. Classification checks
    domain_lower = domain.lower()
    local_lower = local_part.lower()

    if domain_lower in DISPOSABLE_DOMAINS:
        result["classification"]["is_disposable"] = True
    if domain_lower in FREE_DOMAINS:
        result["classification"]["is_free"] = True
    if local_lower in ROLE_PREFIXES:
        result["classification"]["is_role"] = True

    # 3. MX Record Check
    mx_records = []
    try:
        records = dns.resolver.resolve(domain, 'MX')
        for r in records:
            mx_records.append(str(r.exchange).rstrip('.'))
        if mx_records:
            result["domain"]["has_mx"] = True
            result["domain"]["mx_records"] = mx_records
    except Exception as e:
        result["domain"]["has_mx"] = False
        result["syntax"]["reason"] = f"Domain DNS/MX lookup failed: {str(e)}"

    # 4. BriteVerify External API Check
    brite_status = None
    if use_briteverify:
        if not BRITEVERIFY_API_KEY:
            result["briteverify"]["error"] = "BRITEVERIFY_API_KEY is not configured."
        else:
            try:
                bv_resp = requests.get(
                    "https://bpi.briteverify.com/emails.json",
                    params={"address": email, "apikey": BRITEVERIFY_API_KEY},
                    timeout=6,
                )
                if bv_resp.status_code == 200:
                    bv_data = bv_resp.json()
                    result["briteverify"]["success"] = True
                    result["briteverify"]["data"] = bv_data
                    brite_status = bv_data.get("status") # e.g., "valid", "invalid", "unknown"
                else:
                    result["briteverify"]["error"] = f"HTTP {bv_resp.status_code}: {bv_resp.text}"
            except Exception as ex:
                result["briteverify"]["error"] = str(ex)

    if not result["domain"]["has_mx"] and brite_status != "valid":
        result["score"] = 20
        result["status"] = "invalid"
        result["responseTimeMs"] = round((time.time() - start_time) * 1000, 2)
        return result

    # 5. SMTP Mailbox Check (if requested and MX exists)
    smtp_success = False
    smtp_message = "SMTP check skipped or failed."
    smtp_code = 0

    if check_smtp and mx_records:
        mx_host = mx_records[0]
        try:
            server = smtplib.SMTP(timeout=5)
            server.connect(mx_host, 25)
            server.helo(server.local_hostname or "localhost")
            server.mail("verify@example.com")
            code, message = server.rcpt(email)
            server.quit()
            smtp_code = code
            smtp_message = message.decode('utf-8', errors='ignore') if isinstance(message, bytes) else str(message)
            if code == 250:
                smtp_success = True
            elif code in [450, 451, 452]:
                smtp_success = True
                smtp_message = f"Greylisted/Deferred (Code {code}): {smtp_message}"
            else:
                smtp_success = False
        except socket.timeout:
            smtp_message = "SMTP connection timed out (port 25 blocked or slow)."
        except smtplib.SMTPConnectError:
            smtp_message = "SMTP connection refused."
        except Exception as ex:
            smtp_message = f"SMTP check error: {str(ex)}"

    result["smtp"]["success"] = smtp_success
    result["smtp"]["code"] = smtp_code
    result["smtp"]["message"] = smtp_message

    # Calculate final score and status
    score = 100
    if brite_status == "valid":
        score = 95
    elif brite_status == "invalid":
        score = 10
    elif brite_status == "unknown":
        score = 50

    if result["classification"]["is_disposable"]:
        score = min(score, 15)
    if not result["domain"]["has_mx"] and brite_status != "valid":
        score = min(score, 20)
    if check_smtp and not smtp_success and brite_status != "valid":
        score = min(score, 50)
    if result["classification"]["is_role"]:
        score = min(score, 80)

    score = max(0, min(100, score))
    result["score"] = score

    if score >= 80:
        result["status"] = "deliverable"
    elif score >= 50:
        result["status"] = "risky"
    else:
        result["status"] = "undeliverable"

    result["responseTimeMs"] = round((time.time() - start_time) * 1000, 2)
    return result

@app.post("/api/verify")
def verify_email(req: EmailRequest):
    return verify_email_logic(req.email, req.check_smtp, req.use_briteverify)

@app.post("/api/bulk-verify")
def bulk_verify_emails(req: BulkEmailRequest):
    results = []
    for email in req.emails[:50]:
        results.append(verify_email_logic(email.strip(), req.check_smtp, req.use_briteverify))
    return {"total": len(results), "results": results}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Email Verification API + BriteVerify"}

# Serve frontend static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
