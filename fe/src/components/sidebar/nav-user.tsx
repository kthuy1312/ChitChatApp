import { Bell, ChevronsUpDown, UserIcon, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { User } from "@/types/user";
import { useState } from "react";
import Logout from "../auth/logout";
import FriendRequestDialog from "../friendRequest/FriendRequestDialog";
import ProfileDialog from "../profile/ProfileDialog";
import { useFriendStore } from "@/stores/useFriendStore";
import { Badge } from "../ui/badge";
import ManageChatDialog from "../manageChat/ManageChatDialog";


export function NavUser({ user }: { user: User }) {
  const { isMobile } = useSidebar();
  const [friendRequestOpen, setfriendRequestOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false)

  //lấy count lời mời để hiện lên cái chuông
  const { receivedList } = useFriendStore();
  const notificationCount = receivedList?.length ?? 0;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="
    relative
    data-[state=open]:bg-sidebar-accent
    data-[state=open]:text-sidebar-accent-foreground
  "
              >
                {/* Avatar + badge */}
                <div className="relative">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="rounded-lg">
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="
                            absolute
                            -top-1.5
                            -right-1.5
                            h-4 min-w-4
                            px-1
                            flex items-center justify-center
                            text-[10px]
                            leading-none
                          "
                    >
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </Badge>
                  )}
                </div>

                {/* User info */}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.displayName}</span>
                  <span className="truncate text-xs">{user.username}</span>
                </div>

                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>

            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="
                       w-(--radix-dropdown-menu-trigger-width)
                       min-w-56
                       rounded-lg
                       !bg-[hsl(var(--popover))]
                       !text-[hsl(var(--popover-foreground))]
                       border
                       shadow-xl
                       backdrop-blur-none
                       opacity-100
                     "
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.username}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.displayName}</span>
                    <span className="truncate text-xs">{user.username}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <UserIcon className="text-muted-foreground dark:group-focus:!text-accent-foreground" />
                  Tài Khoản
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setfriendRequestOpen(true)}>
                  <div className="relative flex items-center">
                    <Bell className="h-4 w-4 text-muted-foreground dark:group-focus:!text-accent-foreground" />

                    {notificationCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="
                          absolute
                          -top-1.5
                          -right-1.5
                          h-4 min-w-4
                          px-1
                          flex items-center justify-center
                          text-[10px]
                          leading-none
                        "
                      >
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </Badge>
                    )}
                  </div>

                  <span>Thông Báo</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setManageOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Quản lý chat
                </DropdownMenuItem>


              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="
                  cursor-pointer
                  flex items-center gap-2
                  text-destructive
                  bg-destructive/10
                  hover:bg-destructive/20
                  data-[highlighted]:bg-destructive/20
                    data-[highlighted]:text-destructive
                    focus:bg-destructive/20
                    rounded-md
                    "
              >
                <Logout />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <FriendRequestDialog
        open={friendRequestOpen}
        setOpen={setfriendRequestOpen}
      />

      <ProfileDialog
        open={profileOpen}
        setOpen={setProfileOpen}
      />

      <ManageChatDialog
        open={manageOpen}
        setOpen={setManageOpen}
      />
    </>
  );
}