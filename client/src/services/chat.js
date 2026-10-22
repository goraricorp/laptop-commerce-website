"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { caller } from "@/lib/utils/caller";
import { chatSchemas } from "@/schemas/chat";
const groupKey = ["commerce", "chat"];
const endpoints = {
  conversations: "/conversation",
  "conversation-participants": "/conversation/participant",
  messages: "/message",
  "message-attachments": "/message/attachment",
};
function endpoint(resource, id) {
  const path = endpoints[resource];
  if (id === undefined) return path;
  const encodedId = String(id).split(":").map(encodeURIComponent).join("/");
  return `${path}/${encodedId}`;
}
function listResponseSchema(entity) {
  return z.object({
    items: z.array(entity),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  });
}
function useGetConversations(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "conversations",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("conversations"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(chatSchemas["conversation"].entity),
      }),
  });
}
export { useGetConversations as getConversations };
function useGetConversation(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "conversations", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("conversations", id),
        method: "GET",
        schema: chatSchemas["conversation"].entity,
      }),
  });
}
export { useGetConversation as getConversation };
function useCreateConversation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("conversations"),
        method: "POST",
        body: chatSchemas["conversation"].create.parse(data),
        schema: chatSchemas["conversation"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "conversations"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateConversation as createConversation };
function useUpdateConversation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("conversations", id),
        method: "PATCH",
        body: chatSchemas["conversation"].update.parse(data),
        schema: chatSchemas["conversation"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "conversations"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateConversation as updateConversation };
function useDeleteConversation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("conversations", id),
        method: "DELETE",
        schema: chatSchemas["conversation"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "conversations"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteConversation as deleteConversation };
function useGetConversationParticipants(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "conversation-participants",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("conversation-participants"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(
          chatSchemas["conversation-participant"].entity,
        ),
      }),
  });
}
export { useGetConversationParticipants as getConversationParticipants };
function useGetConversationParticipant(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "conversation-participants", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("conversation-participants", id),
        method: "GET",
        schema: chatSchemas["conversation-participant"].entity,
      }),
  });
}
export { useGetConversationParticipant as getConversationParticipant };
function useCreateConversationParticipant(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("conversation-participants"),
        method: "POST",
        body: chatSchemas["conversation-participant"].create.parse(data),
        schema: chatSchemas["conversation-participant"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "conversation-participants"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateConversationParticipant as createConversationParticipant };
function useUpdateConversationParticipant(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("conversation-participants", id),
        method: "PATCH",
        body: chatSchemas["conversation-participant"].update.parse(data),
        schema: chatSchemas["conversation-participant"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "conversation-participants"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateConversationParticipant as updateConversationParticipant };
function useDeleteConversationParticipant(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("conversation-participants", id),
        method: "DELETE",
        schema: chatSchemas["conversation-participant"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "conversation-participants"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteConversationParticipant as deleteConversationParticipant };
function useGetMessages(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "messages",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("messages"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(chatSchemas["message"].entity),
      }),
  });
}
export { useGetMessages as getMessages };
function useGetMessage(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "messages", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("messages", id),
        method: "GET",
        schema: chatSchemas["message"].entity,
      }),
  });
}
export { useGetMessage as getMessage };
function useCreateMessage(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("messages"),
        method: "POST",
        body: chatSchemas["message"].create.parse(data),
        schema: chatSchemas["message"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "messages"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateMessage as createMessage };
function useUpdateMessage(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("messages", id),
        method: "PATCH",
        body: chatSchemas["message"].update.parse(data),
        schema: chatSchemas["message"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "messages"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateMessage as updateMessage };
function useDeleteMessage(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("messages", id),
        method: "DELETE",
        schema: chatSchemas["message"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "messages"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteMessage as deleteMessage };
function useGetMessageAttachments(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "message-attachments",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("message-attachments"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(chatSchemas["message-attachment"].entity),
      }),
  });
}
export { useGetMessageAttachments as getMessageAttachments };
function useGetMessageAttachment(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "message-attachments", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("message-attachments", id),
        method: "GET",
        schema: chatSchemas["message-attachment"].entity,
      }),
  });
}
export { useGetMessageAttachment as getMessageAttachment };
function useCreateMessageAttachment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("message-attachments"),
        method: "POST",
        body: chatSchemas["message-attachment"].create.parse(data),
        schema: chatSchemas["message-attachment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "message-attachments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateMessageAttachment as createMessageAttachment };
function useUpdateMessageAttachment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("message-attachments", id),
        method: "PATCH",
        body: chatSchemas["message-attachment"].update.parse(data),
        schema: chatSchemas["message-attachment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "message-attachments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateMessageAttachment as updateMessageAttachment };
function useDeleteMessageAttachment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("message-attachments", id),
        method: "DELETE",
        schema: chatSchemas["message-attachment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "message-attachments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteMessageAttachment as deleteMessageAttachment };
export const chatServices = {
  conversations: {
    getMany: useGetConversations,
    getOne: useGetConversation,
    create: useCreateConversation,
    update: useUpdateConversation,
    remove: useDeleteConversation,
  },
  "conversation-participants": {
    getMany: useGetConversationParticipants,
    getOne: useGetConversationParticipant,
    create: useCreateConversationParticipant,
    update: useUpdateConversationParticipant,
    remove: useDeleteConversationParticipant,
  },
  messages: {
    getMany: useGetMessages,
    getOne: useGetMessage,
    create: useCreateMessage,
    update: useUpdateMessage,
    remove: useDeleteMessage,
  },
  "message-attachments": {
    getMany: useGetMessageAttachments,
    getOne: useGetMessageAttachment,
    create: useCreateMessageAttachment,
    update: useUpdateMessageAttachment,
    remove: useDeleteMessageAttachment,
  },
};
