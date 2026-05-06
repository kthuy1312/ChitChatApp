export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId,
) => {
  //cần reset seenBy và cập nhật lastMessage
  conversation.set({
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
      imgUrl: message.imgUrl || null,
      isImage: !!message.imgUrl,
    },
  });

  //xly unreadCounts của mỗi người (người gửi về = 0, ng nhận + thêm 1)
  conversation.participants.forEach((p) => {
    const memberId = p.userID.toString();
    const isSender = memberId === senderId.toString(); //nếu id của ng đó trùng id người gửi thì ng đó là ng gửi
    const preCount = conversation.unreadCounts.get(memberId) || 0; //lấy count hiện tại của ng đó
    conversation.unreadCounts.set(memberId, isSender ? 0 : preCount + 1);
  });
};

export const emitNewMessage = async (io, conversation, message) => {
  await conversation.populate([
    { path: "participants.userID", select: "displayName avatarUrl offlineAt" },
    { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    { path: "seenBy", select: "displayName avatarUrl" },
  ]);

  const participants = (conversation.participants || []).map((p) => ({
    _id: p.userID?._id,
    displayName: p.userID?.displayName,
    avatarUrl: p.userID?.avatarUrl ?? null,
    offlineAt: p.userID?.offlineAt || null,
    joinedAt: p.joinedAt,
    isPinned: p.isPinned ?? false,
    isArchived: p.isArchived ?? false,
    isRestricted: p.isRestricted ?? false,
    nickname: p.nickname || null,
  }));

  const formattedConversation = {
    //copy toàn bộ field của object vào object mới
    ...conversation.toObject(),
    participants,
    //Object.fromEntries() chuyển 1 danh sách cặp [key, value] thành obj
    unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
  };

  const payload = {
    message,
    conversation: formattedConversation,
    unreadCounts: formattedConversation.unreadCounts,
  };

  const roomIds = [
    conversation._id.toString(),
    ...participants.map((p) => p._id?.toString()).filter(Boolean),
  ];

  //emit vào room conversation (user đã join sẵn) và personal rooms của từng user (để user chưa join kịp vẫn nhận đc)
  io.to(roomIds).emit("new-message", payload);
};
