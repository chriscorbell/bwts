const urlInput = document.getElementById("url-input");
const generateBtn = document.getElementById("generate-btn");
const copyBtn = document.getElementById("copy-btn");
const copyIcon = document.getElementById("copy-icon");
const checkIcon = document.getElementById("check-icon");
const copyLabel = document.getElementById("copy-label");
const regexOutput = document.getElementById("regex-output");
const statusNode = document.getElementById("status");
const schemeSwitch = document.getElementById("allow-both-schemes");

const OCTET_REGEX = "(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)";

/* ── Switch toggle ── */
schemeSwitch.addEventListener("click", () => {
  const next = schemeSwitch.getAttribute("aria-checked") !== "true";
  schemeSwitch.setAttribute("aria-checked", String(next));
});

function isSchemeSwitchOn() {
  return schemeSwitch.getAttribute("aria-checked") === "true";
}

/* ── Status helpers ── */
function setStatus(message, kind = "muted") {
  statusNode.textContent = message;
  statusNode.className = "";
  if (kind === "error") statusNode.classList.add("error");
  else if (kind === "success") statusNode.classList.add("success");
}

/* ── Regex builder ── */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHostPattern(hostname) {
  if (/^100(?:\.\d{1,3}){3}$/.test(hostname)) {
    return `100\\.${OCTET_REGEX}\\.${OCTET_REGEX}\\.${OCTET_REGEX}`;
  }

  return escapeRegex(hostname);
}

function buildPathPrefixPattern(pathname) {
  if (!pathname || pathname === "/") {
    return "(?:\\/.*)?";
  }

  const escapedPath = escapeRegex(pathname);
  return `${escapedPath}(?:[\\/?#].*)?`;
}

function buildBitwardenRegex(rawUrl, allowAnyScheme) {
  const parsed = new URL(rawUrl);

  if (!parsed.hostname) {
    throw new Error("The URL must include a hostname.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  const schemePattern = allowAnyScheme
    ? "https?:\\/\\/"
    : `${escapeRegex(parsed.protocol)}\\/\\/`;
  const hostPattern = buildHostPattern(parsed.hostname);
  const portPattern = parsed.port ? `:${escapeRegex(parsed.port)}` : "";
  const pathPattern = buildPathPrefixPattern(parsed.pathname);

  return `^${schemePattern}${hostPattern}${portPattern}${pathPattern}$`;
}

/* ── Generate ── */
function handleGenerate() {
  const trimmed = urlInput.value.trim();
  if (!trimmed) {
    regexOutput.value = "";
    setStatus("Enter a URL first.", "error");
    return;
  }

  try {
    const regex = buildBitwardenRegex(trimmed, isSchemeSwitchOn());
    regexOutput.value = regex;
    setStatus("Regex generated.", "success");
  } catch (error) {
    regexOutput.value = "";
    setStatus(error instanceof Error ? error.message : "Invalid input.", "error");
  }
}

/* ── Copy with icon swap ── */
let copyTimeout;

function showCopySuccess() {
  copyIcon.classList.add("hidden");
  checkIcon.classList.remove("hidden");
  copyLabel.textContent = "Copied";
  setStatus("Copied to clipboard.", "success");

  clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    checkIcon.classList.add("hidden");
    copyIcon.classList.remove("hidden");
    copyLabel.textContent = "Copy";
  }, 2000);
}

function fallbackCopyFromTextarea() {
  regexOutput.focus();
  regexOutput.select();
  regexOutput.setSelectionRange(0, regexOutput.value.length);
  return document.execCommand("copy");
}

async function handleCopy() {
  const value = regexOutput.value.trim();
  if (!value) {
    setStatus("Nothing to copy yet.", "error");
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      showCopySuccess();
      return;
    }

    if (fallbackCopyFromTextarea()) {
      showCopySuccess();
      return;
    }

    setStatus("Clipboard copy failed. Select text and copy manually.", "error");
  } catch {
    if (fallbackCopyFromTextarea()) {
      showCopySuccess();
      return;
    }
    setStatus("Clipboard copy failed. Select text and copy manually.", "error");
  }
}

/* ── Event listeners ── */
generateBtn.addEventListener("click", handleGenerate);
copyBtn.addEventListener("click", handleCopy);

urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleGenerate();
  }
});
