import { ResourceForm } from "@/components/form/resource-form"
import { chatSchemas } from "@/schemas/chat"
import { chatServices } from "@/services/chat"

const schemas = {
  conversations: chatSchemas.conversation,
  "conversation-participants": chatSchemas["conversation-participant"],
  messages: chatSchemas.message,
  "message-attachments": chatSchemas["message-attachment"],
}

export function ChatForm() {
  return (
    <ResourceForm
      title="Hội thoại"
      description="Quản lý cuộc trò chuyện, người tham gia, tin nhắn và tệp đính kèm."
      schemas={schemas}
      services={chatServices}
    />
  )
}
