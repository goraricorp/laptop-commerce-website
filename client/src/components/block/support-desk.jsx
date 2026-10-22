import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import {
  NativeSelectOption,
  NativeSelect,
} from "@/components/ui/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field";
import { RelationPicker } from "@/components/form/relation-picker";
import {
  Message,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import PropTypes from "prop-types";
import { useRef, useState, useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { caller } from "@/lib/utils/caller";
import { useUser } from "@/hooks/use-user";
import { toast } from "@/lib/toast";
import {
  ImageDraftProvider,
  ImageField,
} from "@/components/upload/image-field";
import { useImageDraft } from "@/hooks/use-image-draft";
const labels = {
  open: "Đang mở",
  pending: "Đã trả lời",
  closed: "Đã đóng",
};
function MessageForm({ url, create = false, onDone }) {
  const fieldIdPrefix = useId();
  const draft = useImageDraft(),
    [image, setImage] = useState(null),
    request = useRef(null),
    form = useRef(null);
  const mutation = useMutation({
    mutationFn: (data) =>
      caller({
        url,
        method: "POST",
        body: data,
      }),
    onSuccess: () => {
      draft.saved();
      form.current?.reset();
      setImage(null);
      request.current = null;
      toast.add({
        title: "Đã gửi phiếu/tin nhắn",
        type: "success",
      });
      onDone?.();
    },
    onError: async (e) => {
      const discarded = await draft.discardAll();
      if (discarded.length) setImage(null);
      toast.add({
        title: e.message,
        type: "error",
      });
    },
    onSettled: () => draft.endSave(),
  });
  return (
    <ImageDraftProvider draft={draft}>
      <form
        ref={form}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget),
            data = {
              content: fd.get("content"),
              attachments: image ? [image] : [],
              ...(create
                ? {
                    subject: fd.get("subject"),
                  }
                : {}),
            },
            fingerprint = JSON.stringify(data);
          if (request.current?.fingerprint !== fingerprint)
            request.current = {
              fingerprint,
              id: crypto.randomUUID(),
            };
          draft.beginSave();
          mutation.mutate({
            ...data,
            requestId: request.current.id,
          });
        }}
      >
        <FieldGroup className="grid gap-3 rounded border p-4">
          {create && (
            <Field>
              <FieldLabel
                htmlFor={[fieldIdPrefix, "support-desk-2454"].join("-")}
              >
                Tiêu đề phiếu
              </FieldLabel>
              <Input
                name="subject"
                required
                minLength={3}
                maxLength={255}
                id={[fieldIdPrefix, "support-desk-2454"].join("-")}
              />
            </Field>
          )}
          <Field>
            <FieldLabel
              htmlFor={[fieldIdPrefix, "support-desk-2602"].join("-")}
            >
              Nội dung
            </FieldLabel>
            <Textarea
              name="content"
              required
              maxLength={10000}
              id={[fieldIdPrefix, "support-desk-2602"].join("-")}
            />
          </Field>
          <ImageField
            purpose="support"
            field={{
              name: "support-image",
              state: {
                value: image,
              },
              handleChange: setImage,
            }}
            label="Ảnh hỗ trợ"
          />
          <Button type="submit" disabled={mutation.isPending || draft.busy}>
            {mutation.isPending
              ? "Đang gửi…"
              : create
                ? "Tạo phiếu hỗ trợ"
                : "Gửi tin nhắn"}
          </Button>
          {mutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>
    </ImageDraftProvider>
  );
}
MessageForm.propTypes = {
  url: PropTypes.string.isRequired,
  create: PropTypes.bool,
  onDone: PropTypes.func,
};
function TicketThread({ id, root }) {
  const { user } = useUser(),
    client = useQueryClient(),
    [entries, setEntries] = useState([]);
  const after = entries.at(-1)?.id;
  const query = useQuery({
    queryKey: ["support-ticket", user?.id, id],
    queryFn: () =>
      caller({
        url: `${root}/${id}`,
      }),
    refetchInterval: 5000,
  });
  const history = useQuery({
    queryKey: ["support-messages", user?.id, id, after],
    enabled: query.isSuccess,
    refetchInterval: 5000,
    queryFn: async () => {
      const result = await caller({
        url: `${root}/${id}/messages`,
        query: {
          after,
        },
      });
      if (result.items.length)
        setEntries((old) => [
          ...new Map([...old, ...result.items].map((m) => [m.id, m])).values(),
        ]);
      return result;
    },
  });
  const status = useMutation({
    mutationFn: (value) =>
      caller({
        url: `${root}/${id}/status`,
        method: "POST",
        body: {
          status: value,
        },
      }),
    onSuccess: () =>
      void client.invalidateQueries({
        queryKey: ["support-ticket", user?.id, id],
      }),
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  function refresh() {
    void client.invalidateQueries({
      queryKey: ["support-ticket", user?.id, id],
    });
    void client.invalidateQueries({
      queryKey: ["support-messages", user?.id, id],
    });
    void client.invalidateQueries({
      queryKey: ["support-list"],
    });
  }
  if (query.isPending)
    return (
      <div role="status">
        <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
        tải phiếu…
      </div>
    );
  if (query.isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{query.error.message}</AlertDescription>
      </Alert>
    );
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-semibold">{query.data.subject}</h2>
      <p>{labels[query.data.status]}</p>
      <Button
        disabled={status.isPending}
        variant="outline"
        onClick={() =>
          status.mutate(query.data.status === "closed" ? "open" : "closed")
        }
      >
        {query.data.status === "closed" ? "Mở lại phiếu" : "Đóng phiếu"}
      </Button>
      <MessageScrollerProvider autoScroll>
        <MessageScroller className="h-96" aria-label="Trao đổi hỗ trợ">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-4 p-3">
              {entries.map((m) => (
                <MessageScrollerItem
                  key={m.id}
                  messageId={m.id}
                  scrollAnchor={m.senderUserId === user.id}
                >
                  <Message align={m.senderUserId === user.id ? "end" : "start"}>
                    <MessageContent>
                      <MessageHeader>
                        {m.senderUserId === user.id
                          ? "Bạn"
                          : m.senderType === "user"
                            ? "Khách hàng"
                            : "Nhân viên"}{" "}
                      </MessageHeader>
                      <Bubble
                        align={m.senderUserId === user.id ? "end" : "start"}
                        variant={
                          m.senderUserId === user.id ? "default" : "muted"
                        }
                      >
                        <BubbleContent className="whitespace-pre-wrap">
                          {m.content}
                        </BubbleContent>
                      </Bubble>
                      {!!m.attachments?.length && (
                        <AttachmentGroup>
                          {m.attachments.map((a) => (
                            <Attachment key={a.url} state="done">
                              <AttachmentTrigger
                                render={
                                  <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Xem ảnh đính kèm"
                                  />
                                }
                              />
                              <AttachmentMedia variant="image">
                                <img
                                  src={a.url}
                                  referrerPolicy="no-referrer"
                                  alt="Ảnh đính kèm phiếu hỗ trợ"
                                />
                              </AttachmentMedia>
                              <AttachmentContent>
                                <AttachmentTitle>Ảnh đính kèm</AttachmentTitle>
                              </AttachmentContent>
                            </Attachment>
                          ))}
                        </AttachmentGroup>
                      )}
                      <MessageFooter>
                        {new Date(m.createdAt).toLocaleString("vi-VN")}
                      </MessageFooter>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton aria-label="Đến tin nhắn mới nhất" />
        </MessageScroller>
      </MessageScrollerProvider>
      {history.isError && (
        <Alert variant="destructive">
          <AlertDescription>{history.error.message}</AlertDescription>
        </Alert>
      )}
      {query.data.status !== "closed" && (
        <MessageForm key={id} url={`${root}/${id}/messages`} onDone={refresh} />
      )}
    </section>
  );
}
TicketThread.propTypes = {
  id: PropTypes.string.isRequired,
  root: PropTypes.string.isRequired,
};
function AssignStaff({ ticketId, onDone }) {
  const [assigneeId, setAssigneeId] = useState(null);
  const mutation = useMutation({
    mutationFn: () =>
      caller({
        url: `/staff/support/${ticketId}/assign`,
        method: "POST",
        body: {
          assigneeId,
        },
      }),
    onSuccess: () => {
      toast.add({
        title: "Đã phân công nhân viên",
        type: "success",
      });
      onDone();
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  return (
    <div className="grid gap-2">
      <RelationPicker
        resource="users"
        filters={{
          staffOnly: "true",
        }}
        label="Nhân viên hỗ trợ"
        value={assigneeId}
        onChange={setAssigneeId}
      />
      <Button
        disabled={!assigneeId || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Phân công nhân viên
      </Button>
    </div>
  );
}
AssignStaff.propTypes = {
  ticketId: PropTypes.string.isRequired,
  onDone: PropTypes.func.isRequired,
};
export function SupportDesk({ staff = false }) {
  const fieldIdPrefix = useId();
  const { user } = useUser(),
    client = useQueryClient(),
    [page, setPage] = useState(1),
    [queue, setQueue] = useState("mine"),
    [selected, setSelected] = useState(null),
    root = staff ? "/staff/support" : "/me/support";
  const list = useQuery({
    queryKey: ["support-list", user?.id, staff, queue, page],
    enabled: Boolean(user),
    queryFn: () =>
      caller({
        url: root,
        query: {
          page,
          limit: 20,
          ...(staff
            ? {
                queue,
              }
            : {}),
        },
      }),
    refetchInterval: 10000,
  });
  const assign = useMutation({
    mutationFn: (id) =>
      caller({
        url: `${root}/${id}/assign`,
        method: "POST",
        body: {
          assigneeId: user.id,
        },
      }),
    onSuccess: (_, id) => {
      setSelected(id);
      void client.invalidateQueries({
        queryKey: ["support-list"],
      });
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  if (!user)
    return (
      <section>
        <h1 className="text-2xl font-semibold">Liên hệ hỗ trợ</h1>
        <p>Đăng nhập để tạo phiếu và theo dõi phản hồi của nhân viên.</p>
        <a className="underline" href="/auth/sign-in?redirect=%2Fcontact">
          Đăng nhập
        </a>
      </section>
    );
  return (
    <section className="grid gap-5">
      <h1 className="text-2xl font-semibold">
        {staff ? "Phiếu hỗ trợ khách hàng" : "Phiếu hỗ trợ của bạn"}
      </h1>
      <p>
        Nội dung trao đổi và ảnh chỉ dành cho chủ phiếu và nhân viên được phân
        công.
      </p>
      {!staff && (
        <MessageForm create url={root} onDone={() => void list.refetch()} />
      )}
      {staff && (
        <Field>
          <FieldLabel htmlFor={[fieldIdPrefix, "support-desk-9686"].join("-")}>
            Hàng đợi
          </FieldLabel>
          <NativeSelect
            className="w-full"
            aria-label="Hàng đợi hỗ trợ"
            value={queue}
            onChange={(e) => {
              setQueue(e.target.value);
              setPage(1);
            }}
            id={[fieldIdPrefix, "support-desk-9686"].join("-")}
          >
            <NativeSelectOption value="mine">
              Được giao cho tôi
            </NativeSelectOption>
            <NativeSelectOption value="unassigned">
              Chưa phân công
            </NativeSelectOption>
            <NativeSelectOption value="all">
              Tất cả phiếu (chỉ thông tin phân công)
            </NativeSelectOption>
          </NativeSelect>
        </Field>
      )}
      {list.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          tải danh sách…
        </div>
      ) : list.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error.message}</AlertDescription>
        </Alert>
      ) : (
        <>
          {!list.data.items.length && (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  Chưa có phiếu trong danh sách này.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {list.data.items.map((t) => (
            <Item key={t.id} variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>{t.subject}</ItemTitle>
                <Badge variant="secondary">{labels[t.status]}</Badge>
              </ItemContent>
              <ItemActions>
                {staff && t.assignedToId !== user.id ? (
                  <Button
                    disabled={
                      assign.isPending ||
                      Boolean(
                        t.assignedToId &&
                        t.assignedToId !== user.id &&
                        user.role !== "master",
                      )
                    }
                    onClick={() => assign.mutate(t.id)}
                  >
                    Nhận xử lý
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setSelected(t.id)}>
                    Xem trao đổi
                  </Button>
                )}
                {staff && user.role === "master" && (
                  <AssignStaff
                    ticketId={t.id}
                    onDone={() => {
                      void list.refetch();
                      setSelected(null);
                    }}
                  />
                )}
              </ItemActions>
            </Item>
          ))}
        </>
      )}
      <Pagination
        className="flex gap-3 mx-0 w-auto"
        aria-label="Phân trang phiếu"
      >
        <PaginationContent>
          <PaginationItem>
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Trước
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span>Trang {page}</span>
          </PaginationItem>
          <PaginationItem>
            <Button
              disabled={page * 20 >= (list.data?.total ?? 0)}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      {selected && (
        <TicketThread key={`${staff}:${selected}`} id={selected} root={root} />
      )}
    </section>
  );
}
SupportDesk.propTypes = {
  staff: PropTypes.bool,
};
