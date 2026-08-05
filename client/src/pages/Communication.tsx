import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Paperclip,
  Search,
  MessageSquare,
  UserPlus,
  Hash,
  X,
  ArrowLeft,
  MoreVertical,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ChatConversation,
  ChatMessage,
  ChatAttachment,
  fetchConversations,
  createDirectConversation,
  createChannel,
  markConversationRead,
  addChannelMembers,
  removeChannelMember,
  setNotificationPreference,
  fetchMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  uploadChatFile,
} from "@/lib/communicationApi";
import { fetchUsers } from "@/lib/processApi";
import { getCurrentUserId } from "@/lib/authStorage";

const MAX_SIZE_BYTES = 25 * 1024 * 1024;

interface UserOption {
  id: string;
  name: string;
  searchText: string;
}

function userOption(u: any): UserOption {
  const uid = String(u.userId ?? u.id ?? "");
  const name = u.name || u.fullName || u.email || uid;
  return { id: uid, name, searchText: `${name} ${u.designation || ""}`.toLowerCase() };
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function Communication() {
  const { t, dir } = useLanguage();
  const meId = getCurrentUserId();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [composing, setComposing] = useState("");
  const [sending, setSending] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const loadConversations = useCallback(async () => {
    const rows = await fetchConversations();
    setConversations(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadConversations();
    const timer = setInterval(() => void loadConversations(), 20000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  const loadUsers = useCallback(async (): Promise<UserOption[]> => {
    const rows = (await fetchUsers(1000)) as any[];
    return rows.map(userOption).filter((o) => o.id);
  }, []);

  useEffect(() => {
    if (!selected) return;
    void markConversationRead(selected.id).catch(() => {});
    void fetchMessages(selected.id, undefined, 100).then((rows) => setMessages(rows));
  }, [selected]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const selectConversation = (id: string) => {
    setSelectedId(id);
    void markConversationRead(id).catch(() => {});
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    void fetchMessages(id, undefined, 100).then((rows) => setMessages(rows));
  };

  const handleSend = async () => {
    if (!selected) return;
    if (!composing.trim() && !pendingAttachment) return;
    setSending(true);
    try {
      const msg = await sendMessage(selected.id, composing, pendingAttachment);
      setMessages((prev) => [...prev, msg]);
      setComposing("");
      setPendingAttachment(null);
    } catch (e: any) {
      toast.error(e?.message || t("sendFailed") || "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(t("fileTooLarge") || "File is larger than 25MB");
      return;
    }
    setAttaching(true);
    try {
      const attachment = await uploadChatFile(file);
      setPendingAttachment(attachment);
    } catch (e: any) {
      toast.error(e?.message || t("uploadFailed") || "Upload failed");
    } finally {
      setAttaching(false);
    }
  };

  const convTitle = (c: ChatConversation) => {
    if (c.type === "channel") return c.name || t("channel") || "Channel";
    return c.otherParty?.name || t("conversation") || "Conversation";
  };

  const convSubtitle = (c: ChatConversation) => {
    const lm = c.lastMessage;
    if (lm) {
      const body = lm.body || (lm.attachment ? "📎 " + (t("attachment") || "Attachment") : "");
      return `${lm.senderName}: ${body}`;
    }
    if (c.type === "channel") return `${c.memberCount} ${t("members") || "members"}`;
    return "";
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6" dir={dir}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t("chat") || "Chat"}</h1>
            <p className="text-sm text-muted-foreground">
              {t("communicationEngagement") || "Communication & Engagement"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewDm(true)}>
            <MessageSquare className="w-4 h-4 mr-2" /> {t("newMessage") || "New message"}
          </Button>
          <Button onClick={() => setShowNewChannel(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> {t("newChannel") || "New channel"}
          </Button>
        </div>
      </motion.div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
        {/* Conversation list */}
        <div className="border rounded-xl bg-background/80 flex flex-col min-h-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t("searchConversations") || "Search conversations"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-10">
                  {t("noConversations") || "No conversations yet"}
                </div>
              ) : (
                conversations
                  .filter((c) => convTitle(c).toLowerCase().includes(search.trim().toLowerCase()))
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectConversation(c.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all flex gap-3 ${
                        selectedId === c.id ? "bg-sky-50 border border-sky-200" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white">
                            {initials(convTitle(c))}
                          </AvatarFallback>
                        </Avatar>
                        {c.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {c.type === "channel" && <Hash className="w-3 h-3 inline opacity-60 mr-1" />}
                            {convTitle(c)}
                          </span>
                          {c.lastMessage && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatTime(c.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{convSubtitle(c)}</p>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Thread */}
        <div className="border rounded-xl bg-background/80 flex flex-col min-h-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="w-14 h-14" />
              <p>{t("selectConversation") || "Select a conversation to start chatting"}</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedId(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white">
                      {initials(convTitle(selected))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {selected.type === "channel" && <Hash className="w-3 h-3 inline opacity-60 mr-1" />}
                      {convTitle(selected)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selected.type === "channel"
                        ? `${selected.memberCount} ${t("members") || "members"}`
                        : t("directMessage") || "Direct message"}
                    </div>
                  </div>
                </div>
                {selected.type === "channel" && (
                  <Button size="sm" variant="outline" onClick={() => setShowAddMembers(true)}>
                    <UserPlus className="w-4 h-4" /> {t("addMembers") || "Add members"}
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1 min-h-0" ref={scrollRef} type="always">
                <div className="p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-10">
                      {t("noMessages") || "No messages yet. Say hello!"}
                    </div>
                  ) : (
                    messages.map((m) =>
                      m.senderId === meId ? (
                        <MyBubble
                          key={m.id}
                          message={m}
                          t={t}
                          onUpdated={(updated) =>
                            setMessages((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                          }
                          onDeleted={(id) => setMessages((prev) => prev.filter((x) => x.id !== id))}
                        />
                      ) : (
                        <OtherBubble key={m.id} message={m} t={t} />
                      ),
                    )
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                {pendingAttachment && (
                  <div className="mb-2 flex items-center gap-2 bg-muted rounded-lg p-2 text-sm">
                    <Paperclip className="w-4 h-4" />
                    <span className="flex-1 truncate">{pendingAttachment.fileName}</span>
                    <button type="button" onClick={() => setPendingAttachment(null)}>
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    id="chat-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={attaching}
                    onClick={() => document.getElementById("chat-file-input")?.click()}
                    title={t("attachFile") || "Attach file"}
                  >
                    {attaching ? <Skeleton className="h-4 w-4 rounded-full" /> : <Paperclip className="w-4 h-4" />}
                  </Button>
                  <Textarea
                    className="resize-none min-h-[44px] max-h-28 flex-1"
                    rows={1}
                    placeholder={t("typeMessage") || "Type a message…"}
                    value={composing}
                    onChange={(e) => setComposing(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={sending || (!composing.trim() && !pendingAttachment)}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <UserPickerDialog
        open={showNewDm}
        onOpenChange={setShowNewDm}
        title={t("newMessage") || "New message"}
        subtitle={t("pickUserForDm") || "Start a direct conversation"}
        users={userOptions}
        loadUsers={loadUsers}
        meId={meId}
        onSelect={(id) => {
          setShowNewDm(false);
          void createDirectConversation(id).then((conv) => {
            void loadConversations();
            setSelectedId(conv.id);
          });
        }}
        t={t}
      />

      <NewChannelDialog
        open={showNewChannel}
        onOpenChange={setShowNewChannel}
        users={userOptions}
        loadUsers={loadUsers}
        meId={meId}
        onCreated={(conv) => {
          setShowNewChannel(false);
          void loadConversations();
          setSelectedId(conv.id);
        }}
        t={t}
      />

      <AddMembersDialog
        open={showAddMembers}
        onOpenChange={setShowAddMembers}
        users={userOptions}
        loadUsers={loadUsers}
        existingIds={selected?.members.map((m) => m.userId) ?? []}
        onAdd={async (userIds) => {
          if (!selected) return;
          try {
            const updated = await addChannelMembers(selected.id, userIds);
            setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setShowAddMembers(false);
          } catch (e: any) {
            toast.error(e?.message || "Could not add members");
          }
        }}
        t={t}
      />
    </div>
  );
}

function AttachmentView({ attachment, t }: { attachment: ChatAttachment; t: (k: string) => string }) {
  if (!attachment) return null;
  if (attachment.mimeType?.startsWith("image/")) {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer">
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="rounded-lg max-w-[240px] md:max-w-xs border bg-white"
        />
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm hover:bg-muted/70"
    >
      <Paperclip className="w-4 h-4" />
      <span className="truncate max-w-[180px]">{attachment.fileName}</span>
      <span className="text-xs text-muted-foreground">
        {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : ""}
      </span>
    </a>
  );
}

function MyBubble({
  message,
  t,
  onUpdated,
  onDeleted,
}: {
  message: ChatMessage;
  t: (k: string) => string;
  onUpdated: (m: ChatMessage) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(message.body);
  const [menu, setMenu] = useState(false);

  const save = async () => {
    if (!value.trim() || value === message.body) {
      setEditing(false);
      return;
    }
    try {
      const updated = await editMessage(message.conversationId, message.id, value);
      onUpdated(updated);
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not edit message");
    }
  };

  const del = async () => {
    setMenu(false);
    try {
      await deleteMessage(message.conversationId, message.id);
      onDeleted(message.id);
    } catch (e: any) {
      toast.error(e?.message || "Could not delete message");
    }
  };

  return (
    <div className="flex justify-end">
      <div className="flex items-end gap-2 max-w-[75%]">
        <span className="text-[10px] text-muted-foreground mb-1">{formatTime(message.createdAt)}</span>
        <div className="bg-gradient-to-br from-sky-500 to-cyan-600 text-white rounded-2xl rounded-br-sm px-3 py-2">
          {message.attachment && <AttachmentView attachment={message.attachment} t={t} />}
          {editing ? (
            <div className="flex items-center gap-2">
              <Input
                className="bg-white/20 text-white border-white/30"
                value={value}
                autoFocus
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void save();
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <Button size="icon" variant="ghost" className="text-white" onClick={() => void save()}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              {message.body && <div className="whitespace-pre-wrap break-words text-sm">{message.body}</div>}
              <div className="flex items-center justify-end gap-2 mt-1">
                {message.isEdited && (
                  <span className="text-[10px] opacity-70">{t("edited") || "edited"}</span>
                )}
                <DropdownMenu open={menu} onOpenChange={setMenu}>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="opacity-70 hover:opacity-100">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="w-40">
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      <Edit3Icon /> {t("edit") || "Edit"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => void del()}>
                      <TrashIcon /> {t("delete") || "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OtherBubble({ message, t }: { message: ChatMessage; t: (k: string) => string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[75%]">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
            {initials(message.senderName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-[10px] text-muted-foreground ml-1">{message.senderName}</div>
          <div className="bg-slate-100 border rounded-2xl rounded-bl-sm px-3 py-2">
            {message.attachment && <AttachmentView attachment={message.attachment} t={t} />}
            {message.body && <div className="whitespace-pre-wrap break-words text-sm">{message.body}</div>}
            <div className="flex items-center justify-end gap-1 mt-1">
              {message.isEdited && <span className="text-[10px] text-muted-foreground">{t("edited") || "edited"}</span>}
              <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type TT = (k: string) => string;

function UserPickerDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  users,
  loadUsers,
  meId,
  onSelect,
  t,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  title: string;
  subtitle?: string;
  users: UserOption[];
  loadUsers: () => Promise<UserOption[]>;
  meId: string;
  onSelect: (userId: string) => void;
  t: TT;
}) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<UserOption[]>(users);

  useEffect(() => {
    if (open) {
      setQ("");
      void loadUsers().then(setAll);
    }
  }, [open, loadUsers]);

  const filtered = all.filter((u) => u.id !== meId && u.searchText.includes(q.trim().toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {subtitle && <p className="text-sm text-muted-foreground -mt-2">{subtitle}</p>}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("searchUsers") || "Search users"} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
        <ScrollArea className="max-h-72">
          <div className="space-y-1">
            {filtered.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">{t("noUsersFound") || "No users found"}</div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelect(u.id)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-muted/60 flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white text-xs">
                      {initials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{u.name}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function NewChannelDialog({
  open,
  onOpenChange,
  users,
  loadUsers,
  meId,
  onCreated,
  t,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  users: UserOption[];
  loadUsers: () => Promise<UserOption[]>;
  meId: string;
  onCreated: (conv: ChatConversation) => void;
  t: TT;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [q, setQ] = useState("");
  const [all, setAll] = useState<UserOption[]>(users);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDesc("");
      setQ("");
      setSelected([]);
      void loadUsers().then(setAll);
    }
  }, [open, loadUsers]);

  const candidates = all.filter(
    (u) => u.id !== meId && !selected.includes(u.id) && u.searchText.includes(q.trim().toLowerCase()),
  );

  const create = async () => {
    if (!name.trim()) {
      toast.error(t("channelNameRequired") || "Channel name is required");
      return;
    }
    setSaving(true);
    try {
      const conv = await createChannel(name.trim(), desc, selected);
      onCreated(conv);
    } catch (e: any) {
      toast.error(e?.message || "Could not create channel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newChannel") || "New channel"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("channelName") || "Channel name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <Input
            placeholder={t("description") || "Description (optional)"}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div>
            <div className="text-sm font-medium mb-2">{t("addMembers") || "Add members"}</div>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selected.map((id) => {
                  const u = all.find((x) => x.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {u?.name ?? id}
                      <button onClick={() => setSelected((p) => p.filter((s) => s !== id))}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder={t("searchUsers") || "Search users"} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <ScrollArea className="max-h-40 mt-2">
              <div className="space-y-1">
                {candidates.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected((p) => [...p, u.id])}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted/60 flex items-center gap-3"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white text-xs">
                        {initials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{u.name}</span>
                  </button>
                ))}
                {candidates.length === 0 && q && (
                  <div className="text-sm text-muted-foreground py-4 text-center">{t("noUsersFound") || "No users found"}</div>
                )}
              </div>
            </ScrollArea>
          </div>
          <Button className="w-full" onClick={() => void create()} disabled={saving}>
            <Check className="w-4 h-4 mr-2" /> {saving ? t("creating") || "Creating…" : t("createChannel") || "Create channel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMembersDialog({
  open,
  onOpenChange,
  users,
  loadUsers,
  existingIds,
  onAdd,
  t,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  users: UserOption[];
  loadUsers: () => Promise<UserOption[]>;
  existingIds: string[];
  onAdd: (userIds: string[]) => void;
  t: TT;
}) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<UserOption[]>(users);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQ("");
      setSelected([]);
      void loadUsers().then(setAll);
    }
  }, [open, loadUsers]);

  const candidates = all.filter(
    (u) => !existingIds.includes(u.id) && u.searchText.includes(q.trim().toLowerCase()),
  );

  const add = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await onAdd(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addMembers") || "Add members"}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("searchUsers") || "Search users"} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
        <ScrollArea className="max-h-72">
          <div className="space-y-1">
            {candidates.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelected((p) => (p.includes(u.id) ? p.filter((s) => s !== u.id) : [...p, u.id]))}
                className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 ${
                  selected.includes(u.id) ? "bg-sky-50 border border-sky-200" : "hover:bg-muted/60"
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white text-xs">
                    {initials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm flex-1">{u.name}</span>
                {selected.includes(u.id) && <Check className="w-4 h-4 text-sky-600" />}
              </button>
            ))}
            {candidates.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">{t("noUsersFound") || "No users found"}</div>
            )}
          </div>
        </ScrollArea>
        <Button className="w-full" disabled={selected.length === 0 || saving} onClick={() => void add()}>
          {t("addSelected") || "Add selected"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Edit3Icon() {
  return <Edit3 className="w-4 h-4 mr-2" />;
}
function TrashIcon() {
  return <Trash2 className="w-4 h-4 mr-2" />;
}