import { useState } from "react";
import { useParams } from "react-router";
import { ArrowUpRight, Loader2, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomTextArea } from "@/components/custom/custom-textarea";
import { PageShell } from "@/components/layout/page-shell";
import { formatRelativeDate } from "@/utils/relative-date";
import { apiErrorMessage } from "@/utils/api-error";
import {
  useAddTicketCommentMutation,
  useEscalateTicketMutation,
  useGetTicketQuery,
  useTransitionTicketMutation,
} from "@/redux/services/support/support-api";
import type { TicketComment } from "@/redux/services/support/support-types";

/**
 * One ticket, and the conversation on it.
 *
 * The thread is the ticket. Escalating does not open a second one and does not
 * move this one anywhere: the same reference and the same replies travel up, so
 * the person who raised it keeps watching the thing they were given rather than
 * losing it into a ticket they cannot see.
 *
 * What the reader may do here is the server's answer, not this screen's.
 * `capabilities` arrives per ticket because access is not a permission alone -
 * the person who raised a ticket may reply to it whatever keys they hold, and a
 * triager's reach is narrowed by branch. Reading a permission here instead
 * would be a second opinion that can disagree with the one that counts.
 */
export default function SupportTicketDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useGetTicketQuery(id, { skip: !id });
  const ticket = data?.data;

  const [reply, setReply] = useState("");
  const [escalateNote, setEscalateNote] = useState("");
  const [escalateOpen, setEscalateOpen] = useState(false);

  const [addComment, { isLoading: replying }] = useAddTicketCommentMutation();
  const [escalate, { isLoading: escalating }] = useEscalateTicketMutation();
  const [transition, { isLoading: transitioning }] = useTransitionTicketMutation();

  if (isLoading) {
    return (
      <PageShell>
        <div className="grid h-72 place-content-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (isError || !ticket) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-border bg-white py-20 text-center">
          <p className="font-mont text-sm font-medium text-gray-05">
            We could not load this ticket
          </p>
          <button onClick={() => refetch()} className="mt-2 text-sm font-medium text-primary">
            Try again
          </button>
        </div>
      </PageShell>
    );
  }

  const canComment = ticket.capabilities?.can_comment !== false;
  const canManage = ticket.capabilities?.can_manage === true;
  // Offered exactly when the endpoint would accept it: the server already
  // accounts for "already escalated" and for a CodeX ticket.
  const canEscalate = ticket.capabilities?.can_escalate === true;
  const isEscalated = Boolean(ticket.escalated_at);
  const isClosed = ticket.status === "CLOSED";

  const send = async () => {
    if (!reply.trim()) return;
    try {
      await addComment({ id: ticket.id, body: reply.trim() }).unwrap();
      setReply("");
    } catch (error) {
      toast.error(apiErrorMessage(error, "We could not post your reply."));
    }
  };

  const sendUp = async () => {
    try {
      await escalate({ id: ticket.id, note: escalateNote.trim() }).unwrap();
      setEscalateNote("");
      setEscalateOpen(false);
      toast.success("Sent to CodeX support.");
    } catch (error) {
      toast.error(apiErrorMessage(error, "We could not send this to CodeX."));
    }
  };

  const move = async (status: "RESOLVED" | "CLOSED") => {
    try {
      await transition({ id: ticket.id, status }).unwrap();
    } catch (error) {
      toast.error(apiErrorMessage(error, "We could not update this ticket."));
    }
  };

  return (
    <PageShell className="space-y-5 text-black-01">
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mont text-xs text-gray-05">{ticket.ticket_number}</p>
            <h1 className="mt-0.5 font-mont text-lg font-semibold text-black-01">
              {ticket.title}
            </h1>
            <p className="mt-1 text-xs text-gray-01">
              Raised by {ticket.requester?.name ?? "somebody"}{" "}
              {formatRelativeDate(ticket.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-03 px-3 py-1 font-mont text-xs font-medium text-black-01">
              {ticket.status.replace("_", " ").toLowerCase()}
            </span>
            {isEscalated && (
              <span className="rounded-full bg-pry-01 px-3 py-1 font-mont text-xs font-medium text-primary">
                With CodeX
              </span>
            )}
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm text-gray-01">{ticket.description}</p>

        {isEscalated && (
          // Said plainly, because the person who raised it should not have to
          // work out from a badge why the school went quiet.
          <p className="mt-4 rounded-xl bg-pry-01/40 px-3 py-2 text-[13px] text-primary">
            {ticket.escalated_by?.name ?? "Your school"} sent this to CodeX{" "}
            {formatRelativeDate(ticket.escalated_at!)}. Replies here still reach
            everybody on it.
          </p>
        )}
      </div>

      {/* ── The conversation ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="font-mont text-sm font-semibold">Conversation</p>
        {!ticket.comments?.length ? (
          <p className="mt-3 text-sm text-gray-01">
            No replies yet. Anything written here is seen by everybody on the
            ticket.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {ticket.comments.map((comment: TicketComment) => (
              <li key={comment.id} className="grid gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mont text-sm font-medium text-black-01">
                    {comment.author?.name ?? "Unknown"}
                  </span>
                  {comment.author?.tenant_kind === "PLATFORM" && (
                    <span className="rounded-full bg-pry-01 px-2 py-0.5 text-[10px] font-medium text-primary">
                      CodeX
                    </span>
                  )}
                  <span className="text-xs text-gray-05">
                    {formatRelativeDate(comment.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-01">{comment.body}</p>
                {comment.attachments?.length > 0 && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-05">
                    <Paperclip className="size-3.5" />
                    {comment.attachments.length} file
                    {comment.attachments.length === 1 ? "" : "s"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {canComment && !isClosed && (
          <div className="mt-5 grid gap-2">
            <CustomTextArea
              id="reply"
              label="Reply"
              rows={3}
              placeholder="Add what you have found, or what you have tried."
              value={reply}
              onChange={(event) => setReply(event.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={send} loading={replying} disabled={!reply.trim() || replying}>
                <Send className="size-4" />
                Post reply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── What a triager may do with it ────────────────────────────────── */}
      {canManage && !isClosed && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="font-mont text-sm font-semibold">Manage this ticket</p>

          {canEscalate ? (
            <>
              <p className="mt-1 text-xs text-gray-01">
                This is your school's to solve. If it is beyond you, send it to
                CodeX and the whole thread goes with it.
              </p>
              {escalateOpen ? (
                <div className="mt-3 grid gap-2">
                  <CustomTextArea
                    id="escalate-note"
                    label="What have you already tried?"
                    rows={3}
                    placeholder="One line saves CodeX asking you the same question."
                    value={escalateNote}
                    onChange={(event) => setEscalateNote(event.target.value)}
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEscalateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={sendUp} loading={escalating} disabled={escalating}>
                      <ArrowUpRight className="size-4" />
                      Send to CodeX
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setEscalateOpen(true)}>
                    <ArrowUpRight className="size-4" />
                    Send to CodeX
                  </Button>
                  {ticket.status !== "RESOLVED" && (
                    <Button
                      variant="outline"
                      onClick={() => move("RESOLVED")}
                      loading={transitioning}
                    >
                      Mark resolved
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => move("CLOSED")} loading={transitioning}>
                    Close
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <p className="w-full text-xs text-gray-01">
                CodeX has this one. You can still reply, and close it once it is
                sorted.
              </p>
              <Button variant="ghost" onClick={() => move("CLOSED")} loading={transitioning}>
                Close
              </Button>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
