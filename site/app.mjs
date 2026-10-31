import { parseBulkEmails, verifyEmail } from "./verify.mjs";

const singleInput = document.querySelector("#single-email");
const bulkInput = document.querySelector("#bulk-emails");
const output = document.querySelector("#json-output");
const summary = document.querySelector("#summary");
const history = document.querySelector("#history-list");
const sendButton = document.querySelector("#send-btn");
const verifySingleButton = document.querySelector("#verify-single");
const verifyBulkButton = document.querySelector("#verify-bulk");
const responseTime = document.querySelector("#response-time");

const recentResults = [];
const MAX_HISTORY = 8;

verifySingleButton.addEventListener("click", async () => {
  await runChecks([singleInput.value]);
});

verifyBulkButton.addEventListener("click", async () => {
  try {
    const emails = parseBulkEmails(bulkInput.value);
    if (emails.length === 0) {
      throw new Error("Enter at least one email address.");
    }
    await runChecks(emails);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Unable to read email list.");
  }
});

singleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    verifySingleButton.click();
  }
});

document.querySelectorAll("[data-email]").forEach((button) => {
  button.addEventListener("click", () => {
    singleInput.value = button.dataset.email;
    verifySingleButton.click();
  });
});

async function runChecks(emails) {
  setBusy(true);
  const startedAt = performance.now();

  try {
    const results = [];
    for (let index = 0; index < emails.length; index += 5) {
      const batch = emails.slice(index, index + 5);
      results.push(...(await Promise.all(batch.map((email) => verifyEmail(email)))));
    }

    output.textContent = JSON.stringify(
      results.length === 1
        ? results[0]
        : { total: results.length, results },
      null,
      2,
    );
    responseTime.textContent = `${Math.round(performance.now() - startedAt)} ms`;
    renderSummary(results);
    updateHistory(results);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Verification failed.");
  } finally {
    setBusy(false);
  }
}

function renderSummary(results) {
  summary.replaceChildren();

  for (const result of results) {
    const card = document.createElement("article");
    card.className = "result-card";

    const email = document.createElement("h3");
    email.textContent = result.email || "(empty address)";

    const status = document.createElement("p");
    status.className = `status status-${result.status}`;
    status.textContent = statusLabel(result.status);

    const domain = document.createElement("p");
    domain.textContent = result.domain.checked
      ? result.domain.has_mx
        ? `MX records: ${result.domain.mx_records.join(", ")}`
        : result.domain.reason
      : result.domain.reason;

    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = [
      result.classification.is_disposable ? "Disposable domain" : "",
      result.classification.is_free ? "Free email provider" : "",
      result.classification.is_role ? "Role-based address" : "",
    ]
      .filter(Boolean)
      .join(" · ") || "No listed risk flags.";

    card.append(email, status, domain, note);
    summary.append(card);
  }
}

function statusLabel(status) {
  const labels = {
    invalid_syntax: "Invalid syntax",
    mx_found: "Domain has MX records; mailbox not verified",
    no_mx: "No MX records found",
    unknown: "Domain check unavailable",
  };
  return labels[status] ?? status;
}

function updateHistory(results) {
  recentResults.unshift(...results);
  recentResults.length = Math.min(recentResults.length, MAX_HISTORY);
  history.replaceChildren();

  for (const result of recentResults) {
    const item = document.createElement("li");
    item.textContent = `${result.email || "(empty)"} — ${statusLabel(result.status)}`;
    history.append(item);
  }
}

function showError(message) {
  output.textContent = JSON.stringify({ error: message }, null, 2);
}

function setBusy(isBusy) {
  sendButton.disabled = isBusy;
  sendButton.textContent = isBusy ? "Checking DNS..." : "Ready";
  verifySingleButton.disabled = isBusy;
  verifyBulkButton.disabled = isBusy;
}
