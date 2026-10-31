const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "dispostable.com",
  "emailondeck.com",
  "fakemailgenerator.com",
  "getairmail.com",
  "getnada.com",
  "guerrillamail.com",
  "maildrop.cc",
  "mailinator.com",
  "mohmal.com",
  "sharklasers.com",
  "temp-mail.org",
  "tempmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
]);

const FREE_DOMAINS = new Set([
  "aol.com",
  "gmx.com",
  "gmail.com",
  "hotmail.com",
  "icloud.com",
  "mail.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
  "zoho.com",
]);

const ROLE_PREFIXES = new Set([
  "abuse",
  "admin",
  "administrator",
  "billing",
  "compliance",
  "contact",
  "help",
  "hostmaster",
  "hr",
  "info",
  "jobs",
  "media",
  "office",
  "postmaster",
  "press",
  "privacy",
  "sales",
  "security",
  "support",
  "team",
]);

const LOCAL_ATOM = "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+";
const LOCAL_PART_PATTERN = new RegExp(`^${LOCAL_ATOM}(?:\\.${LOCAL_ATOM})*$`);

export function parseEmail(email) {
  const value = email.trim();
  const separator = value.lastIndexOf("@");

  if (
    separator < 1 ||
    separator !== value.indexOf("@") ||
    value.length > 254
  ) {
    return null;
  }

  const localPart = value.slice(0, separator);
  const domain = value.slice(separator + 1);
  const labels = domain.split(".");

  if (
    localPart.length > 64 ||
    !LOCAL_PART_PATTERN.test(localPart) ||
    labels.length < 2 ||
    labels.some(
      (label) =>
        label.length < 1 ||
        label.length > 63 ||
        !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label),
    )
  ) {
    return null;
  }

  return { value, localPart, domain };
}

export async function lookupMxRecords(domain, fetchImpl = globalThis.fetch) {
  const url = new URL("https://dns.google/resolve");
  url.searchParams.set("name", domain);
  url.searchParams.set("type", "MX");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/dns-json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DNS lookup failed with HTTP ${response.status}.`);
    }

    const answer = await response.json();

    if (answer.Status !== 0) {
      throw new Error(`DNS lookup returned status ${answer.Status}.`);
    }

    return (answer.Answer ?? [])
      .filter((record) => record.type === 15 && typeof record.data === "string")
      .map((record) => record.data.replace(/^\d+\s+/, "").replace(/\.$/, ""))
      .filter(Boolean);
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyEmail(email, fetchImpl = globalThis.fetch) {
  const startedAt = performance.now();
  const parsed = parseEmail(email);
  const result = {
    email: email.trim(),
    syntax: {
      valid: parsed !== null,
      reason:
        parsed === null
          ? "Invalid email syntax or domain format."
          : "Email syntax is valid.",
    },
    domain: {
      name: parsed?.domain ?? "",
      checked: false,
      has_mx: false,
      mx_records: [],
      reason: parsed ? "MX lookup has not completed." : "Not checked.",
    },
    classification: {
      is_disposable: false,
      is_free: false,
      is_role: false,
    },
    smtp: {
      success: false,
      code: null,
      message: "SMTP mailbox checks are not available in a browser-only app.",
    },
    briteverify: {
      enabled: false,
      success: false,
      data: null,
      error:
        "Not configured: API credentials cannot be safely stored in a public static app.",
    },
    status: "invalid_syntax",
    responseTimeMs: 0,
    note: "An MX record does not confirm that an individual mailbox exists.",
  };

  if (parsed) {
    const domain = parsed.domain.toLowerCase();
    const localPart = parsed.localPart.toLowerCase();

    result.classification.is_disposable = DISPOSABLE_DOMAINS.has(domain);
    result.classification.is_free = FREE_DOMAINS.has(domain);
    result.classification.is_role = ROLE_PREFIXES.has(localPart);

    try {
      result.domain.mx_records = await lookupMxRecords(domain, fetchImpl);
      result.domain.checked = true;
      result.domain.has_mx = result.domain.mx_records.length > 0;
      result.domain.reason = result.domain.has_mx
        ? "MX records found. The email mailbox itself has not been tested."
        : "The DNS response contains no MX records.";
      result.status = result.domain.has_mx ? "mx_found" : "no_mx";
    } catch (error) {
      result.domain.reason =
        error instanceof Error ? error.message : "DNS lookup failed.";
      result.status = "unknown";
    }
  }

  result.responseTimeMs = Math.round((performance.now() - startedAt) * 100) / 100;
  return result;
}

export function parseBulkEmails(text, limit = 50) {
  const emails = text
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);

  if (emails.length > limit) {
    throw new RangeError(`Please enter no more than ${limit} email addresses.`);
  }

  return emails;
}
