export type Board = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
};

export type BoardMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  joinedAt: string;
};

export type BoardInvite = {
  id: string;
  boardId: string;
  boardName: string;
  invitedEmail: string;
  createdBy: string;
  inviterName: string;
  createdAt: string;
  expiresAt: string;
};
