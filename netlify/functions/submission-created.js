/**
 * Netlify event-triggered function: fires automatically when a form
 * submission is created. Creates a Linear issue for each feature request.
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

exports.handler = async function (event) {
  const { payload } = JSON.parse(event.body);
  const { form_name, data } = payload;

  // Only handle the feature-request form
  if (form_name !== "feature-request") {
    return { statusCode: 200, body: "Not a feature request — skipped." };
  }

  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    console.error("LINEAR_API_KEY not set");
    return { statusCode: 500, body: "LINEAR_API_KEY not configured." };
  }

  let title = (data.title || "Untitled feature request").trim();
  let description = data.description || "";
  let name = data.name || "Anonymous";
  let email = data.email || "not provided";
  const priority = PRIORITY_MAP[data.priority] || 4;

  // Validate inputs
  if (title.length > 200) title = title.slice(0, 200);
  if (description.length > 5000) return { statusCode: 400, body: 'Description too long (max 5000 chars).' };
  if (email !== 'not provided' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    email = 'invalid email provided';
  }

  // Sanitize user-provided values before building markdown
  name = sanitizeMarkdown(name);
  email = sanitizeMarkdown(email);
  description = sanitizeMarkdown(description);

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

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }
  `;

  const variables = {
    input: {
      teamId: TEAM_ID,
      title: `[Customer request] ${title}`,
      description: markdown,
      priority: priority,
      labelIds: [LABEL_FEATURE, LABEL_HELP_CENTER],
    },
  };

  console.log(JSON.stringify({ event: 'submission', form: form_name, title: title.slice(0, 50), timestamp: new Date().toISOString() }));

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
