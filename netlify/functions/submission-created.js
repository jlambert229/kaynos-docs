/**
 * Netlify event-triggered function: fires automatically when a form
 * submission is created. Creates a Linear issue for each submission.
 *
 * Handles two forms:
 *   - feature-request → "[Customer request] …" with FEATURE + HELP_CENTER labels
 *   - contact-support → "[Support] …" with HELP_CENTER label, priority Medium
 *
 * Required env var: LINEAR_API_KEY (set in Netlify dashboard → Site settings → Environment variables)
 *
 * Linear team ID and label IDs are hardcoded for the KAY team.
 */

const LINEAR_API = "https://api.linear.app/graphql";
const TEAM_ID = "43202946-d721-46b4-a33f-ed07dd8cfee2";
const LABEL_FEATURE = "61e8e02a-b0ca-4f23-9c55-7feb5c7c8dba";
const LABEL_HELP_CENTER = "9f803902-f8f4-4553-8f49-89e1becff555";

const PRIORITY_MAP = {
  "nice-to-have": 4,   // Low
  "important": 2,      // High
  "critical": 1,       // Urgent
};

/**
 * Fetch with retry logic for transient failures.
 * Retries once on 5xx responses or network errors (not on AbortError).
 */
async function fetchWithRetry(url, options, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.status >= 500 && attempt < retries) {
        console.log(`Attempt ${attempt + 1} failed with ${res.status}, retrying...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < retries && err.name !== 'AbortError') {
        console.log(`Attempt ${attempt + 1} failed: ${err.message}, retrying...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Strip angle brackets and collapse excessive newlines from user input
 * to prevent markdown injection.
 */
function sanitizeMarkdown(str) {
  return String(str).replace(/[<>]/g, '').replace(/\n{3,}/g, '\n\n');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYLOAD_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Verify that the payload looks like a real Netlify form-submission event
 * rather than an arbitrary POST to the function URL. Netlify always sends
 * id (UUID), site_url, and a recent created_at; an attacker forging a
 * payload would have to match all three — and the site_url has to match
 * the deploy's own URL, which is set by Netlify at build time.
 */
function looksLikeNetlifyEvent(payload) {
  if (!payload.id || !UUID_RE.test(payload.id)) return false;
  const expectedSite = process.env.URL;
  if (expectedSite && payload.site_url !== expectedSite) return false;
  const ts = Date.parse(payload.created_at);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() - ts) > PAYLOAD_MAX_AGE_MS) return false;
  return true;
}

function clean(str, max) {
  const s = sanitizeMarkdown(String(str || '').trim());
  return s.length > max ? s.slice(0, max) : s;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildFeatureRequestIssue(data) {
  const title = clean(data.title, 200) || "Untitled feature request";
  const description = clean(data.description, 5000);
  if (description.length === 0) return { error: 'Description required.' };
  const name = clean(data.name, 200) || 'Anonymous';
  const rawEmail = clean(data.email, 200);
  const email = !rawEmail ? 'not provided' : isValidEmail(rawEmail) ? rawEmail : 'invalid email provided';
  const priority = PRIORITY_MAP[data.priority] || 4;
  const markdown = [
    `## Customer feature request`,
    ``,
    `**From:** ${name} (${email})`,
    `**Priority (self-reported):** ${data.priority || "not specified"}`,
    ``,
    `---`,
    ``,
    description,
    ``,
    `---`,
    `_Submitted via [docs.kaynos.net](https://docs.kaynos.net/#feature-requests) feature request form._`,
  ].join("\n");
  return {
    input: {
      teamId: TEAM_ID,
      title: `[Customer request] ${title}`,
      description: markdown,
      priority,
      labelIds: [LABEL_FEATURE, LABEL_HELP_CENTER],
    },
  };
}

function buildContactSupportIssue(data) {
  const subject = clean(data.subject, 200) || "Untitled support request";
  const description = clean(data.description, 5000);
  if (description.length === 0) return { error: 'Description required.' };
  const rawEmail = clean(data.email, 200);
  if (!rawEmail || !isValidEmail(rawEmail)) return { error: 'Valid email required.' };
  const name = clean(data.name, 200) || 'Anonymous';
  const markdown = [
    `## Customer support request`,
    ``,
    `**From:** ${name} (${rawEmail})`,
    ``,
    `---`,
    ``,
    description,
    ``,
    `---`,
    `_Submitted via [docs.kaynos.net](https://docs.kaynos.net/#contact) support form. Reply to the email above._`,
  ].join("\n");
  return {
    input: {
      teamId: TEAM_ID,
      title: `[Support] ${subject}`,
      description: markdown,
      // Medium priority by default — support team can re-prioritise on triage.
      priority: 3,
      labelIds: [LABEL_HELP_CENTER],
    },
  };
}

function buildArticleFeedbackIssue(data) {
  const helpful = clean(data.helpful, 10);
  const pageId = clean(data.pageId, 200) || 'unknown';
  const pageTitle = clean(data.pageTitle, 200) || pageId;
  const comment = clean(data.comment, 5000);
  // Positive feedback is recorded by Netlify Forms (visible in the dashboard)
  // but does not warrant a Linear issue per page-rating.
  if (helpful !== 'no') return { skipReason: `Positive feedback for ${pageId} — recorded only.` };
  if (comment.length === 0) return { error: 'Comment required for negative feedback.' };
  const markdown = [
    `## Docs feedback — page rated unhelpful`,
    ``,
    `**Page:** ${pageTitle} (\`${pageId}\`)`,
    `**URL:** https://docs.kaynos.net/#${pageId}`,
    ``,
    `---`,
    ``,
    comment,
    ``,
    `---`,
    `_Submitted via the "Was this page helpful?" widget at the bottom of the article._`,
  ].join("\n");
  return {
    input: {
      teamId: TEAM_ID,
      title: `[Docs feedback] ${pageTitle}`.slice(0, 200),
      description: markdown,
      priority: 4, // Low — review in next docs sweep
      labelIds: [LABEL_HELP_CENTER],
    },
  };
}

exports.handler = async function (event) {
  let payload;
  try {
    ({ payload } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'Malformed JSON body.' };
  }
  if (!payload || typeof payload !== 'object') {
    return { statusCode: 400, body: 'Missing payload.' };
  }

  // Only handle real Netlify form events. Reject direct POSTs that try to
  // spoof a submission. Return 200 so abuse callers can't probe which check
  // failed.
  if (!looksLikeNetlifyEvent(payload)) {
    console.log(JSON.stringify({ event: 'rejected_non_netlify_payload', timestamp: new Date().toISOString() }));
    return { statusCode: 200, body: 'OK' };
  }

  const { form_name, data = {} } = payload;

  // Route based on form. Each form posts a Netlify form submission; we triage
  // each into a Linear issue (or a no-op for positive ratings) with a
  // different label set + title prefix.
  let issueInput;
  if (form_name === "feature-request") {
    issueInput = buildFeatureRequestIssue(data);
  } else if (form_name === "contact-support") {
    issueInput = buildContactSupportIssue(data);
  } else if (form_name === "article-feedback") {
    issueInput = buildArticleFeedbackIssue(data);
  } else {
    return { statusCode: 200, body: `Form '${form_name}' not handled — skipped.` };
  }
  if (issueInput.error) return { statusCode: 400, body: issueInput.error };
  if (issueInput.skipReason) {
    console.log(JSON.stringify({ event: 'feedback_recorded_only', form: form_name, reason: issueInput.skipReason, timestamp: new Date().toISOString() }));
    return { statusCode: 200, body: issueInput.skipReason };
  }

  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    console.error("LINEAR_API_KEY not set");
    return { statusCode: 500, body: "LINEAR_API_KEY not configured." };
  }

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }
  `;

  const variables = { input: issueInput.input };

  console.log(JSON.stringify({ event: 'submission', form: form_name, title: issueInput.input.title.slice(0, 80), timestamp: new Date().toISOString() }));

  try {
    const res = await fetchWithRetry(LINEAR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const json = await res.json();

    if (json.data?.issueCreate?.success) {
      const issue = json.data.issueCreate.issue;
      console.log(JSON.stringify({ event: 'issue_created', identifier: issue.identifier, url: issue.url, timestamp: new Date().toISOString() }));
      return { statusCode: 200, body: `Created ${issue.identifier}` };
    } else {
      console.error(JSON.stringify({ event: 'linear_error', errors: json.errors || json, timestamp: new Date().toISOString() }));
      return { statusCode: 500, body: "Failed to create Linear issue." };
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(JSON.stringify({ event: 'linear_timeout', timestamp: new Date().toISOString() }));
      return { statusCode: 504, body: 'Linear API timeout.' };
    }
    console.error(JSON.stringify({ event: 'linear_request_failed', error: err.message, timestamp: new Date().toISOString() }));
    return { statusCode: 500, body: "Linear API request failed." };
  }
};
