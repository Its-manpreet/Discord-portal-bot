import { Database } from "bun:sqlite";

const db = new Database("links.sqlite");

db.run(`
  CREATE TABLE IF NOT EXISTS links (
    source_channel_id TEXT NOT NULL,
    target_channel_id TEXT NOT NULL,
    PRIMARY KEY (source_channel_id, target_channel_id)
  )
`);

db.run(`
    CREATE TABLE IF NOT EXISTS webhooks (
        channel_id TEXT PRIMARY KEY,
        webhook_id TEXT NOT NULL,
        webhook_token TEXT NOT NULL
    )
    `)

// sourceChannelId -> Set of targetChannelIds
const links = new Map();
const webhooks = new Map();

function addToMap(source, target) {
  if (!links.has(source)) links.set(source, new Set());
  links.get(source).add(target);
}

function removeFromMap(source, target) {
  if (!links.has(source)) return;
  links.get(source).delete(target);
  if (links.get(source).size === 0) links.delete(source);
}

function addToWebhookMap(channelId, webhookId, webhookToken) {
  webhooks.set(channelId, { webhookId, webhookToken });
}

function removeFromWebhookMap(channelId) {
  webhooks.delete(channelId);
}

// Load everything from disk once, at startup
for (const row of db.query("SELECT * FROM links").all()) {
  addToMap(row.source_channel_id, row.target_channel_id);
}

for (const row of db.query("SELECT * FROM webhooks").all()) {
  addToWebhookMap(row.channel_id, row.webhook_id, row.webhook_token);
}

const insert = db.prepare("INSERT OR IGNORE INTO links VALUES (?, ?)");
const remove = db.prepare("DELETE FROM links WHERE source_channel_id = ? AND target_channel_id = ?");

export function getTargets(channelId) {
  return links.get(channelId); // Set or undefined
}

export function addLink(a, b) {
  // two rows = bidirectional
  db.transaction(() => {
    insert.run(a, b);
    insert.run(b, a);
  })();
  addToMap(a, b);
  addToMap(b, a);
}

export function removeLink(a, b) {
  db.transaction(() => {
    remove.run(a, b);
    remove.run(b, a);
  })();
  removeFromMap(a, b);
  removeFromMap(b, a);
}

export function getWebhook(channelId) {
  return webhooks.get(channelId); // { webhookId, webhookToken } or undefined
}

export function addWebhook(channelId, webhookId, webhookToken) {
  db.run("INSERT OR REPLACE INTO webhooks VALUES (?, ?, ?)", channelId, webhookId, webhookToken);
  addToWebhookMap(channelId, webhookId, webhookToken);
}

export function removeWebhook(channelId) {
  db.run("DELETE FROM webhooks WHERE channel_id = ?", channelId);
  removeFromWebhookMap(channelId);
}