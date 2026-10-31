import assert from "node:assert/strict";
import test from "node:test";
import { parseBulkEmails, parseEmail, verifyEmail } from "../site/verify.mjs";

test("accepts a normal email address and normalizes whitespace", () => {
  assert.deepEqual(parseEmail("  person@example.com "), {
    value: "person@example.com",
    localPart: "person",
    domain: "example.com",
  });
});

test("rejects malformed addresses and invalid domain labels", () => {
  for (const email of [
    "not-an-email",
    "one@@example.com",
    ".person@example.com",
    "person..name@example.com",
    "person@-example.com",
    "person@example..com",
  ]) {
    assert.equal(parseEmail(email), null, email);
  }
});

test("looks up MX records and reports browser-only limitations", async () => {
  let requestedUrl;
  const fetchImpl = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({
        Status: 0,
        Answer: [
          { type: 1, data: "192.0.2.1" },
          { type: 15, data: "10 mx1.example.com." },
        ],
      }),
    };
  };

  const result = await verifyEmail("support@example.com", fetchImpl);

  assert.equal(requestedUrl.searchParams.get("type"), "MX");
  assert.equal(result.domain.has_mx, true);
  assert.deepEqual(result.domain.mx_records, ["mx1.example.com"]);
  assert.equal(result.classification.is_role, true);
  assert.equal(result.status, "mx_found");
  assert.deepEqual(result.risk, {
    level: "medium",
    flags: ["Role-based address"],
  });
  assert.match(result.smtp.message, /not available in a browser-only app/);
  assert.equal(result.briteverify.enabled, false);
});

test("invalid addresses do not make a DNS request", async () => {
  const result = await verifyEmail("invalid", async () => {
    assert.fail("DNS must not be queried for invalid syntax.");
  });

  assert.equal(result.status, "invalid_syntax");
  assert.equal(result.domain.checked, false);
  assert.deepEqual(result.risk, {
    level: "high",
    flags: ["Invalid email syntax"],
  });
});

test("surfaces DNS failures instead of reporting a successful check", async () => {
  const result = await verifyEmail("person@example.com", async () => ({
    ok: false,
    status: 503,
  }));

  assert.equal(result.status, "unknown");
  assert.equal(result.domain.checked, false);
  assert.match(result.domain.reason, /HTTP 503/);
  assert.deepEqual(result.risk, {
    level: "unknown",
    flags: ["Domain MX status could not be confirmed"],
  });
});

test("classifies disposable domains as high risk", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ Status: 0, Answer: [] }),
  });
  const result = await verifyEmail("person@mailinator.com", fetchImpl);

  assert.equal(result.classification.is_disposable, true);
  assert.equal(result.classification.is_free, false);
  assert.deepEqual(result.risk, {
    level: "high",
    flags: ["Disposable email domain", "Domain has no MX records"],
  });
});

test("classifies free email providers as low risk", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      Status: 0,
      Answer: [{ type: 15, data: "10 mx.gmail.com." }],
    }),
  });
  const result = await verifyEmail("person@gmail.com", fetchImpl);

  assert.equal(result.classification.is_free, true);
  assert.deepEqual(result.risk, {
    level: "low",
    flags: ["Free email provider"],
  });
});

test("flags domains without MX records as high risk", async () => {
  const result = await verifyEmail("person@example.com", async () => ({
    ok: true,
    json: async () => ({ Status: 0, Answer: [] }),
  }));

  assert.deepEqual(result.risk, {
    level: "high",
    flags: ["Domain has no MX records"],
  });
});

test("parses bulk addresses and rejects lists over the configured limit", () => {
  assert.deepEqual(parseBulkEmails("one@example.com, two@example.org\nthree@example.net"), [
    "one@example.com",
    "two@example.org",
    "three@example.net",
  ]);
  assert.throws(() => parseBulkEmails("a b c", 2), RangeError);
});
