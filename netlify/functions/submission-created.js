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

  const title = (data.title || "Untitled feature request").trim();
  const description = data.description || "";
  const name = data.name || "Anonymous";
  const email = data.email || "not provided";
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

  try {
    const res = await fetch(LINEAR_API, {
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
      console.log(`Created Linear issue: ${issue.identifier} — ${issue.url}`);
      return { statusCode: 200, body: `Created ${issue.identifier}` };
    } else {
      console.error("Linear API error:", JSON.stringify(json.errors || json));
      return { statusCode: 500, body: "Failed to create Linear issue." };
    }
  } catch (err) {
    console.error("Linear API request failed:", err);
    return { statusCode: 500, body: "Linear API request failed." };
  }
};
