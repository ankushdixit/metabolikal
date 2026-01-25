"use client";

import { useState } from "react";
import { useCreate } from "@refinedev/core";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/lib/database.types";

interface SendMessageModalProps {
  client: Profile | null;
  adminId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal for sending a message to a client
 * Creates a notification that appears in the client's dashboard
 */
export function SendMessageModal({
  client,
  adminId,
  isOpen,
  onClose,
  onSuccess,
}: SendMessageModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const createMutation = useCreate();

  const handleSubmit = () => {
    if (!client || !title.trim() || !message.trim() || isPending) return;

    createMutation.mutate(
      {
        resource: "notifications",
        values: {
          user_id: client.id,
          sender_id: adminId,
          type: "message",
          title: title.trim(),
          message: message.trim(),
        },
      },
      {
        onSuccess: () => {
          setTitle("");
          setMessage("");
          onClose();
          onSuccess?.();
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTitle("");
      setMessage("");
      onClose();
    }
  };

  const isPending = createMutation.mutation.isPending;
  const isFormValid = title.trim() !== "" && message.trim() !== "";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card p-0 max-h-[85vh] flex flex-col">
        {/* Top accent */}
        <div className="h-1 gradient-electric" />

        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Send <span className="gradient-athletic">Message</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold text-sm">
            {client ? `To: ${client.full_name}` : "Select a client"}
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
              placeholder="e.g., Great progress this week!"
              className="bg-secondary border-border"
              disabled={isPending}
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
              placeholder="Write your message to the client..."
              className="w-full p-3 bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none h-32"
              disabled={isPending}
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
          >
            <Send className="h-4 w-4" />
            <span>{isPending ? "Sending..." : "Send Message"}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
