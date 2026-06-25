import type { Entity } from "./base";

export type MeetingType = "INSTANT" | "SCHEDULED";

export type MeetingStatus = "SCHEDULED" | "ACTIVE" | "ENDED" | "CANCELLED";

export type ParticipantRole = "HOST" | "PARTICIPANT";

export type JoinSource = "HOST" | "INVITATION" | "JOIN_CODE";

export type ParticipationStatus =
  | "INVITED"
  | "WAITING_APPROVAL"
  | "APPROVED"
  | "JOINED"
  | "LEFT"
  | "REJECTED"
  | "REMOVED";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export type Meeting = Entity<{
  title: string;
  description: string | null;
  hostId: string;
  hostFirstName: string | null;
  hostLastName: string | null;
  meetingType: MeetingType;
  joinCode: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
}>;

export type JoinMeeting = Entity<{
  title: string;
  description: string | null;
  hostId: string;
  hostFirstName: string | null;
  hostLastName: string | null;
  meetingType: MeetingType;
  joinCode: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  status: MeetingStatus;
}>;

export type MeetingInvitation = Entity<{
  meetingId: string;
  meetingTitle: string;
  meetingType: MeetingType;
  meetingStatus: MeetingStatus;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  inviterId: string;
  inviterFirstName: string | null;
  inviterLastName: string | null;
  inviteeId: string;
  status: InvitationStatus;
  sentAt: string;
  respondedAt: string | null;
}>;

export type MeetingParticipant = Entity<{
  meetingId: string;
  userId: string;
  role: ParticipantRole;
  joinSource: JoinSource;
  participationStatus: ParticipationStatus;
  requestedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  joinedAt: string | null;
  leftAt: string | null;
  removedAt: string | null;
  removedBy: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export interface LiveKitJoinToken {
  token: string;
  liveKitUrl: string;
  roomName: string;
  identity: string;
  participantName: string | null;
  expiresAt: string;
}

export type MeetingMinutesStatus = "GENERATING" | "COMPLETED" | "FAILED";

export interface MeetingMinutes {
  id: string;
  meetingId: string;
  status: MeetingMinutesStatus;
  contentMarkdown: string | null;
  published: boolean;
  model: string;
  generatedById: string;
  generatedAt: string;
  updatedAt: string;
  sourceSegmentCount: number;
  chunkCount: number;
  failureReason: string | null;
}

export type MeetingMinutesListStatus = "NONE" | "GENERATING" | "COMPLETED" | "FAILED";

export interface MeetingMinutesListItem {
  meetingId: string;
  meetingTitle: string;
  meetingDescription: string | null;
  hostId: string;
  hostFirstName: string | null;
  hostLastName: string | null;
  meetingStatus: MeetingStatus;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  minutesId: string | null;
  minutesStatus: MeetingMinutesListStatus;
  published: boolean;
  generatedAt: string | null;
  updatedAt: string | null;
}


