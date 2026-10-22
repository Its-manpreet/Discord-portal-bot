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
db.run(`
    CREATE TABLE IF NOT EXISTS sticky_messages (
        channel_id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL
    )
  `)

// sourceChannelId -> Set of targetChannelIds
const links = new Map(); // channelId -> Set of linked channelIds
const webhooks = new Map(); // channelId -> { webhookId, webhookToken }
const stickyMessages = new Map(); // channelId -> messageId
const messageToWebhookMap = new Map(); // messageId -> { webhookId, webhookToken, targetChannelId, webhookMessageId }
const linkPending = new Map(); // sourceChannelId -> targetChannelId

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

for (const row of db.query("SELECT * FROM sticky_messages").all()) {
  stickyMessages.set(row.channel_id, row.message_id);
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

export function getStickyMessage(channelId) {
  return stickyMessages.get(channelId); // messageId or undefined
}

export function setStickyMessage(channelId, messageId) {
  stickyMessages.set(channelId, messageId);
  db.run("INSERT OR REPLACE INTO sticky_messages VALUES (?, ?)", channelId, messageId);
}

export function removeStickyMessage(channelId) {
  db.run("DELETE FROM sticky_messages WHERE channel_id = ?", channelId);
  stickyMessages.delete(channelId);
}

export function removeMessageFromWebhookMap(messageId) {
  messageToWebhookMap.delete(messageId);
}

export function addMessageToWebhookMap(messageId, webhookId, webhookToken, targetChannelId, webhookMessageId) {
  messageToWebhookMap.set(messageId, { webhookId, webhookToken, targetChannelId, webhookMessageId });
  setTimeout(() => {
    messageToWebhookMap.delete(messageId);
  }, 5 * 60 * 1000); // Remove after 5 minutes
}

export function getMessageFromWebhookMap(messageId) {
  return messageToWebhookMap.get(messageId); // { webhookId, webhookToken, targetChannelId, webhookMessageId } or undefined
}

export function setLinkPending(sourceChannelId, targetChannelId) {
  linkPending.set(sourceChannelId, targetChannelId);
}

export function getLinkPending(sourceChannelId) {
  return linkPending.get(sourceChannelId); // targetChannelId or undefined
}

export function removeLinkPending(sourceChannelId) {
  linkPending.delete(sourceChannelId);
}
