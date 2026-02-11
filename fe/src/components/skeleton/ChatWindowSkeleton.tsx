import { SidebarInset } from "../ui/sidebar";

const ChatWindowSkeleton = () => {
  return (
    <SidebarInset className="flex w-full h-full bg-transparent">
      <div className="flex flex-col flex-1 bg-primary-foreground rounded-2xl overflow-hidden animate-pulse">

        {/* HEADER */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 bg-muted rounded-full" />
          <div className="space-y-2">
            <div className="w-40 h-4 bg-muted rounded" />
            <div className="w-24 h-3 bg-muted rounded" />
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 p-6 space-y-6 overflow-hidden">

          {/* LEFT */}
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="w-60 h-10 bg-muted rounded-2xl" />
          </div>

          {/* RIGHT */}
          <div className="flex justify-end">
            <div className="w-48 h-10 bg-muted rounded-2xl" />
          </div>

          {/* LEFT LONG */}
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="w-72 h-14 bg-muted rounded-2xl" />
          </div>

          {/* RIGHT LONG */}
          <div className="flex justify-end">
            <div className="w-64 h-12 bg-muted rounded-2xl" />
          </div>

          {/* LEFT */}
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="w-52 h-10 bg-muted rounded-2xl" />
          </div>

          {/* RIGHT SMALL */}
          <div className="flex justify-end">
            <div className="w-36 h-8 bg-muted rounded-2xl" />
          </div>

          {/* LEFT */}
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="w-80 h-16 bg-muted rounded-2xl" />
          </div>

        </div>

        {/* INPUT */}
        <div className="p-4 border-t flex items-center gap-3">
          <div className="flex-1 h-10 bg-muted rounded-full" />
          <div className="w-10 h-10 bg-muted rounded-full" />
        </div>

      </div>
    </SidebarInset>
  );
};

export default ChatWindowSkeleton;
