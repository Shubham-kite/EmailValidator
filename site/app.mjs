import { parseBulkEmails, verifyEmail } from "./verify.mjs?v=4";

const singleInput = document.querySelector("#single-email");
const output = document.querySelector("#json-output");
const history = document.querySelector("#history-list");
const verifySingleButton = document.querySelector("#verify-single");
const responseTime = document.querySelector("#time-val");

const briteCard = document.querySelector("#brite-result-card");
const bvEmail = document.querySelector("#bv-email");
const bvStatusBadge = document.querySelector("#bv-status-badge");
const bvRisk = document.querySelector("#bv-risk");
const bvMx = document.querySelector("#bv-mx");
const bvDisp = document.querySelector("#bv-disp");
const bvReason = document.querySelector("#bv-reason");

const recentResults = [];
const MAX_HISTORY = 10;

verifySingleButton.addEventListener("click", async () => {
  const email = singleInput.value.trim();
  if (!email) {
    showError("Please enter an email address to verify.");
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

document.querySelectorAll(".preset-item").forEach((el) => {
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
  if (briteCard) briteCard.classList.remove("hidden");
  if (bvEmail) bvEmail.textContent = result.email || "(empty)";

  const isValid = result.syntax.valid && result.domain.has_mx;
  if (bvStatusBadge) {
    bvStatusBadge.textContent = isValid ? "Valid" : "Invalid / Risky";
    bvStatusBadge.className = isValid
      ? "px-5 py-2 rounded-full text-sm font-extrabold uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/30"
      : "px-5 py-2 rounded-full text-sm font-extrabold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/30";
  }

  if (bvRisk) {
    bvRisk.textContent = result.risk.level;
    bvRisk.className = `text-lg font-bold mt-1 uppercase ${result.risk.level === 'high' ? 'text-red-400' : result.risk.level === 'medium' ? 'text-yellow-400' : 'text-green-400'}`;
  }

  if (bvMx) {
    bvMx.textContent = result.domain.has_mx ? (result.domain.mx_records[0] || "Found") : "No MX";
    bvMx.className = result.domain.has_mx ? "text-sm font-semibold text-[#7ee787] mt-1 truncate" : "text-sm font-semibold text-red-400 mt-1";
  }

  if (bvDisp) {
    bvDisp.textContent = result.classification.is_disposable ? "Yes (Disposable)" : "No";
    bvDisp.className = result.classification.is_disposable ? "text-sm font-semibold text-red-400 mt-1" : "text-sm font-semibold text-white mt-1";
  }

  if (bvReason) {
    bvReason.textContent = `Syntax: ${result.syntax.reason} | Domain: ${result.domain.reason} | Flags: ${result.risk.flags.join(", ") || "None"}`;
  }
}

function updateHistory(results) {
  recentResults.unshift(...results);
  recentResults.length = Math.min(recentResults.length, MAX_HISTORY);
  if (!history) return;
  history.replaceChildren();

  for (const result of recentResults) {
    const item = document.createElement("li");
    item.className = "px-4 py-2.5 rounded-xl bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] cursor-pointer flex items-center justify-between text-xs text-[#ccc] transition";
    const isValid = result.syntax.valid && result.domain.has_mx;
    item.innerHTML = `<span class="truncate font-mono text-white">${result.email || "(empty)"}</span><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isValid ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}">${isValid ? 'Valid' : 'Invalid'}</span>`;

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
  verifySingleButton.innerHTML = isBusy
    ? '<i class="fa-solid fa-spinner animate-spin text-sm"></i><span>Verifying...</span>'
    : '<span>Verify Now</span><i class="fa-solid fa-arrow-right text-xs"></i>';
}
