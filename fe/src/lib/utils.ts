import { clsx, type ClassValue } from "clsx";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatOnlineTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 60) {
    return `${diffMins}m`; // 5m, 45m
  } else if (diffHours < 24) {
    return `${diffHours}h`; // 3h, 20h
  } else if (diffDays < 30) {
    return `${diffDays}d`; // 1d, 12d
  } else if (diffMonths < 12) {
    return `${diffMonths}m`; // 1m, 2m, 11m
  } else {
    return `${diffYears}y`; // 1y, 2y
  }
};

export const formatMessageTime = (date: Date) => {
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isToday) {
    return timeStr; // ví dụ: "14:35"
  } else if (isYesterday) {
    return `Hôm qua ${timeStr}`; // ví dụ: "Hôm qua 23:10"
  } else if (date.getFullYear() === now.getFullYear()) {
    return `${date.getDate()}/${date.getMonth() + 1} ${timeStr}`; // ví dụ: "22/9 09:15"
  } else {
    return `${date.getDate()}/${date.getMonth() + 1
      }/${date.getFullYear()} ${timeStr}`; // ví dụ: "15/12/2023 18:40"
  }
};

//để hiện thị trạng thái online của user
export const formatUserStatus = (isOnline: boolean, offlineAt?: string | Date | null) => {
  if (isOnline) return "Đang hoạt động";
  if (!offlineAt) return "Ngoại tuyến";

  const date = new Date(offlineAt);
  if (isNaN(date.getTime())) return "Ngoại tuyến";

  // Sử dụng lại hàm formatOnlineTime bạn đã viết ở trên để lấy "5m", "3h", "1d"...
  const timeAgo = formatOnlineTime(date);

  return `Hoạt động ${timeAgo} trước`;
};

//Tự update khi trạng thái online/offline thay đổi
export const useTimeAgo = (isOnline: boolean, offlineAt: string | Date | null) => {
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Cập nhật ngay lập tức khi vào chat
    setStatus(formatUserStatus(isOnline, offlineAt));

    if (isOnline) return; // Nếu online thì không cần chạy timer

    const timer = setInterval(() => {
      setStatus(formatUserStatus(isOnline, offlineAt));
    }, 60000);

    return () => clearInterval(timer);
  }, [isOnline, offlineAt]);

  return status;
};