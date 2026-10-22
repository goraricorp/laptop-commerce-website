import * as chatService from "../services/chat.js";
function sendList(req, res, items) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  return res.status(200).json({
    items: items.slice(offset, offset + limit),
    page,
    limit,
    total: items.length,
  });
}
function sendItem(req, res, item, name, status = 200) {
  return item
    ? res.status(status).json(item)
    : res.status(404).json({
        message: `${name} not found`,
      });
}
export async function getConversations(req, res) {
  return sendList(req, res, await chatService.getConversations());
}
export async function getConversation(req, res) {
  return sendItem(
    req,
    res,
    await chatService.getConversation(req.params.id),
    "Conversation",
  );
}
export async function createConversation(req, res) {
  return sendItem(
    req,
    res,
    await chatService.createConversation(req["body"]),
    "Conversation",
    201,
  );
}
export async function updateConversation(req, res) {
  return sendItem(
    req,
    res,
    await chatService.updateConversation(req.params.id, req["body"]),
    "Conversation",
  );
}
export async function deleteConversation(req, res) {
  return sendItem(
    req,
    res,
    await chatService.deleteConversation(req.params.id),
    "Conversation",
  );
}
export async function getConversationParticipants(req, res) {
  return sendList(req, res, await chatService.getConversationParticipants());
}
export async function getConversationParticipant(req, res) {
  return sendItem(
    req,
    res,
    await chatService.getConversationParticipant(req.params.id),
    "Conversation participant",
  );
}
export async function createConversationParticipant(req, res) {
  return sendItem(
    req,
    res,
    await chatService.createConversationParticipant(req["body"]),
    "Conversation participant",
    201,
  );
}
export async function updateConversationParticipant(req, res) {
  return sendItem(
    req,
    res,
    await chatService.updateConversationParticipant(req.params.id, req["body"]),
    "Conversation participant",
  );
}
export async function deleteConversationParticipant(req, res) {
  return sendItem(
    req,
    res,
    await chatService.deleteConversationParticipant(req.params.id),
    "Conversation participant",
  );
}
export async function getMessages(req, res) {
  return sendList(req, res, await chatService.getMessages());
}
export async function getMessage(req, res) {
  return sendItem(
    req,
    res,
    await chatService.getMessage(req.params.id),
    "Message",
  );
}
export async function createMessage(req, res) {
  return sendItem(
    req,
    res,
    await chatService.createMessage(req["body"]),
    "Message",
    201,
  );
}
export async function updateMessage(req, res) {
  return sendItem(
    req,
    res,
    await chatService.updateMessage(req.params.id, req["body"]),
    "Message",
  );
}
export async function deleteMessage(req, res) {
  return sendItem(
    req,
    res,
    await chatService.deleteMessage(req.params.id),
    "Message",
  );
}
export async function getMessageAttachments(req, res) {
  return sendList(req, res, await chatService.getMessageAttachments());
}
export async function getMessageAttachment(req, res) {
  return sendItem(
    req,
    res,
    await chatService.getMessageAttachment(req.params.id),
    "Message attachment",
  );
}
export async function createMessageAttachment(req, res) {
  return sendItem(
    req,
    res,
    await chatService.createMessageAttachment(req["body"]),
    "Message attachment",
    201,
  );
}
export async function updateMessageAttachment(req, res) {
  return sendItem(
    req,
    res,
    await chatService.updateMessageAttachment(req.params.id, req["body"]),
    "Message attachment",
  );
}
export async function deleteMessageAttachment(req, res) {
  return sendItem(
    req,
    res,
    await chatService.deleteMessageAttachment(req.params.id),
    "Message attachment",
  );
}
