"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/auth";
import { Send, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface BulkNotificationModalProps {
  selectedClientIds: string[];
  adminId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal for sending bulk notifications to multiple clients
 * Creates a notification for each selected client
 */
export function BulkNotificationModal({
  selectedClientIds,
  adminId,
  isOpen,
  onClose,
  onSuccess,
}: BulkNotificationModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    if (selectedClientIds.length === 0 || !title.trim() || !message.trim() || isPending) return;

    setIsPending(true);

    try {
      const supabase = createBrowserSupabaseClient();

      // Create notifications for all selected clients
      const notifications = selectedClientIds.map((clientId) => ({
        user_id: clientId,
        sender_id: adminId,
        type: "message" as const,
        title: title.trim(),
        message: message.trim(),
      }));

      const { error } = await supabase.from("notifications").insert(notifications);

      if (error) {
        throw error;
      }

      // Send push notifications to all selected clients
      try {
        const pushResponse = await fetch("/api/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: selectedClientIds,
            notification: {
              title: title.trim(),
              body:
                message.trim().length > 100 ? `${message.trim().slice(0, 97)}...` : message.trim(),
              data: {
                url: "/dashboard",
                type: "message",
              },
            },
          }),
        });
        const pushResult = await pushResponse.json();
        console.log("Push notification result:", pushResult);
        if (pushResult.sent > 0) {
          toast.success(`Push sent to ${pushResult.sent} device(s)`);
        }
      } catch (pushError) {
        console.error("Failed to send push notifications:", pushError);
        // Don't throw - in-app notifications were already sent
      }

      toast.success(
        `Notification sent to ${selectedClientIds.length} client${selectedClientIds.length !== 1 ? "s" : ""}`
      );
      setTitle("");
      setMessage("");
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to send bulk notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTitle("");
      setMessage("");
      onClose();
    }
  };

  const isFormValid = title.trim() !== "" && message.trim() !== "";
  const clientCount = selectedClientIds.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card p-0 max-h-[85vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Bulk <span className="gradient-athletic">Notification</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span data-testid="client-count">
              Sending to {clientCount} client{clientCount !== 1 ? "s" : ""}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Subject Input */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Subject *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Important Update"
              className="bg-secondary border-border"
              disabled={isPending}
              data-testid="title-input"
            />
          </div>

          {/* Message Input */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message to all selected clients..."
              className="w-full p-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-32"
              disabled={isPending}
              data-testid="message-input"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isPending}
            className={cn(
              "btn-athletic w-full flex items-center justify-center gap-2 px-5 py-4 gradient-electric text-black glow-power",
              (!isFormValid || isPending) && "opacity-50 cursor-not-allowed"
            )}
            data-testid="submit-button"
          >
            <Send className="h-4 w-4" />
            <span>
              {isPending
                ? "Sending..."
                : `Send to ${clientCount} Client${clientCount !== 1 ? "s" : ""}`}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
