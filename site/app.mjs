import { parseBulkEmails, verifyEmail } from "./verify.mjs?v=5";

const singleInput = document.querySelector("#single-email");
const output = document.querySelector("#json-output");
const history = document.querySelector("#history-list");
const verifySingleButton = document.querySelector("#verify-single");
const responseTime = document.querySelector("#time-val");

const briteCard = document.querySelector("#brite-result-card");
const bvEmail = document.querySelector("#bv-email");
const bvStatusPill = document.querySelector("#bv-status-pill");
const bvRisk = document.querySelector("#bv-risk");
const bvMx = document.querySelector("#bv-mx");
const bvDisp = document.querySelector("#bv-disp");
const bvReason = document.querySelector("#bv-reason");

const recentResults = [];
const MAX_HISTORY = 10;

verifySingleButton.addEventListener("click", async () => {
  const email = singleInput.value.trim();
  if (!email) {
    alert("Please enter an email address to verify.");
    return;
  }
  await runChecks([email]);
});

singleInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    verifySingleButton.click();
  }
});

document.querySelectorAll(".preset-chip").forEach((el) => {
  el.addEventListener("click", () => {
    const email = el.dataset.email;
    singleInput.value = email;
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

    const payload = results.length === 1 ? results[0] : { total: results.length, results };
    const jsonStr = JSON.stringify(payload, null, 2);

    if (output) output.textContent = jsonStr;

    const duration = Math.round(performance.now() - startedAt);
    if (responseTime) responseTime.textContent = `${duration}ms`;

    if (results.length > 0) {
      renderBriteVerifyCard(results[0]);
    }
    updateHistory(results);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Verification failed.");
  } finally {
    setBusy(false);
  }
}

function renderBriteVerifyCard(result) {
  if (briteCard) briteCard.classList.add("visible");
  if (bvEmail) bvEmail.textContent = result.email || "(empty)";

  const isValid = result.syntax.valid && result.domain.has_mx;
  if (bvStatusPill) {
    bvStatusPill.textContent = isValid ? "Valid" : "Invalid / Risky";
    bvStatusPill.className = isValid ? "status-pill valid" : "status-pill invalid";
  }

  if (bvRisk) {
    bvRisk.textContent = result.risk.level;
    bvRisk.className = `metric-value ${result.risk.level === 'high' ? 'red' : result.risk.level === 'medium' ? 'yellow' : 'green'}`;
  }

  if (bvMx) {
    bvMx.textContent = result.domain.has_mx ? (result.domain.mx_records[0] || "Verified") : "No MX";
    bvMx.className = result.domain.has_mx ? "metric-value green" : "metric-value red";
  }

  if (bvDisp) {
    bvDisp.textContent = result.classification.is_disposable ? "Yes" : "No";
    bvDisp.className = result.classification.is_disposable ? "metric-value red" : "metric-value green";
  }

  if (bvReason) {
    bvReason.textContent = `Syntax: ${result.syntax.reason}\nDomain: ${result.domain.reason}\nFlags: ${result.risk.flags.join(", ") || "None"}`;
  }
}

function updateHistory(results) {
  recentResults.unshift(...results);
  recentResults.length = Math.min(recentResults.length, MAX_HISTORY);
  if (!history) return;
  history.replaceChildren();

  for (const result of recentResults) {
    const item = document.createElement("li");
    item.className = "history-item";
    const isValid = result.syntax.valid && result.domain.has_mx;
    item.innerHTML = `<span>${result.email || "(empty)"}</span><span class="status-pill ${isValid ? 'valid' : 'invalid'}" style="font-size: 10px; padding: 2px 8px;">${isValid ? 'Valid' : 'Invalid'}</span>`;

    item.addEventListener("click", () => {
      singleInput.value = result.email;
      verifySingleButton.click();
    });

    history.append(item);
  }
}

function showError(message) {
  const errObj = { error: message };
  if (output) output.textContent = JSON.stringify(errObj, null, 2);
}

function setBusy(isBusy) {
  verifySingleButton.disabled = isBusy;
  verifySingleButton.textContent = isBusy ? "Verifying..." : "Verify Now";
}
