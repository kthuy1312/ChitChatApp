import type { FriendRequest } from "@/types/user";
import type { ReactNode } from "react";
import UserAvatar from "../chat/UserAvatar";
import { formatOnlineTime } from "@/lib/utils";

interface RequestItemProps {
  requestInfo: FriendRequest;
  actions: ReactNode;
  type: "sent" | "received";
}

const FriendRequestItem = ({ requestInfo, actions, type }: RequestItemProps) => {
  if (!requestInfo) return null;

  const info = type === "sent" ? requestInfo.to : requestInfo.from;
  if (!info) return null;

  const message = requestInfo.message;
  const time = requestInfo.updatedAt
    ? formatOnlineTime(new Date(requestInfo.updatedAt))
    : null;

  return (
    <div className="rounded-xl border bg-background p-3 shadow-sm hover:bg-muted/40 transition">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            type="sidebar"
            name={info.displayName}
            avatarUrl={info.avatarUrl}
          />

          <div className="min-w-0">
            <p className="font-medium truncate">
              {info.displayName}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              @{info.username}
            </p>
          </div>
        </div>

        {/* Time */}
        {time && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {time}
          </span>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-foreground/90">
          {message}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {actions}
      </div>

    </div>
  );
};

export default FriendRequestItem;
