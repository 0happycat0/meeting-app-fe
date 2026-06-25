import { API_ENDPOINTS } from "@/config/api-endpoints";
import apiClient from "@/lib/axios";
import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  Meeting,
  JoinMeeting,
  MeetingType,
  MeetingStatus,
  MeetingInvitation,
  MeetingParticipant,
  LiveKitJoinToken,
  MeetingMinutes,
  MeetingMinutesListItem,
} from "@/types/entities/meeting";

export interface CreateMeetingRequest {
  title: string;
  description: string | null;
  meetingType: MeetingType;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
}

export interface UpdateMeetingRequest {
  title: string;
  description: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
}

export interface TranscriptSegmentPayload {
  segmentId: string;
  text: string;
  latencyMsFromFirstAudio?: number;
  tokenCount?: number;
  totalTokensEmitted?: number;
  clientCreatedAt: string;
}

export interface UploadTranscriptBatchRequest {
  segments: TranscriptSegmentPayload[];
}

export interface GetMyMeetingsParams {
  status?: MeetingStatus;
  type?: MeetingType;
}

// POST /meetings
export const createMeeting = async (data: CreateMeetingRequest): Promise<Meeting> => {
  const response = await apiClient.post<ApiResponse<Meeting>>(
    API_ENDPOINTS.meeting,
    data
  );
  return response.data.result;
};

// GET /meetings/my
export const fetchMyMeetings = async (
  params?: GetMyMeetingsParams
): Promise<ApiResponse<PageResponse<Meeting>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<Meeting>>>(
    API_ENDPOINTS.myMeetings,
    { params }
  );
  return response.data;
};

// GET /meetings/{meetingId}
export const fetchMeetingDetail = async (id: string): Promise<ApiResponse<Meeting>> => {
  const response = await apiClient.get<ApiResponse<Meeting>>(
    API_ENDPOINTS.meetingById(id)
  );
  return response.data;
};

// GET /meetings/join/{joinCode}
export const resolveJoinCode = async (joinCode: string): Promise<ApiResponse<JoinMeeting>> => {
  const trimmedCode = joinCode.trim();
  const response = await apiClient.get<ApiResponse<JoinMeeting>>(
    API_ENDPOINTS.joinByCode(trimmedCode)
  );
  return response.data;
};

// PUT /meetings/{meetingId}
export const updateMeeting = async (
  id: string,
  data: UpdateMeetingRequest
): Promise<Meeting> => {
  const response = await apiClient.put<ApiResponse<Meeting>>(
    API_ENDPOINTS.meetingById(id),
    data
  );
  return response.data.result;
};

// PATCH /meetings/{meetingId}/cancel
export const cancelMeeting = async (id: string): Promise<Meeting> => {
  const response = await apiClient.patch<ApiResponse<Meeting>>(
    API_ENDPOINTS.cancelMeeting(id)
  );
  return response.data.result;
};

// PATCH /meetings/{meetingId}/end
export const endMeeting = async (id: string): Promise<Meeting> => {
  const response = await apiClient.patch<ApiResponse<Meeting>>(
    API_ENDPOINTS.endMeeting(id)
  );
  return response.data.result;
};

// POST /meetings/{meetingId}/invitations
export const createInvitation = async (
  meetingId: string,
  inviteeId: string
): Promise<MeetingInvitation> => {
  const response = await apiClient.post<ApiResponse<MeetingInvitation>>(
    API_ENDPOINTS.meetingInvitations(meetingId),
    { inviteeId }
  );
  return response.data.result;
};

// GET /meetings/{meetingId}/invitations
export const fetchMeetingInvitations = async (
  meetingId: string
): Promise<ApiResponse<PageResponse<MeetingInvitation>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<MeetingInvitation>>>(
    API_ENDPOINTS.meetingInvitations(meetingId)
  );
  return response.data;
};

// GET /invitations/my
export const fetchMyInvitations = async (): Promise<ApiResponse<PageResponse<MeetingInvitation>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<MeetingInvitation>>>(
    API_ENDPOINTS.myInvitations
  );
  return response.data;
};

// PATCH /invitations/{invitationId}/accept
export const acceptInvitation = async (id: string): Promise<MeetingInvitation> => {
  const response = await apiClient.patch<ApiResponse<MeetingInvitation>>(
    API_ENDPOINTS.invitationAccept(id)
  );
  return response.data.result;
};

// PATCH /invitations/{invitationId}/decline
export const declineInvitation = async (id: string): Promise<MeetingInvitation> => {
  const response = await apiClient.patch<ApiResponse<MeetingInvitation>>(
    API_ENDPOINTS.invitationDecline(id)
  );
  return response.data.result;
};

// PATCH /invitations/{invitationId}/cancel
export const cancelInvitation = async (id: string): Promise<MeetingInvitation> => {
  const response = await apiClient.patch<ApiResponse<MeetingInvitation>>(
    API_ENDPOINTS.invitationCancel(id)
  );
  return response.data.result;
};

// POST /meetings/{meetingId}/waiting-room/requests
export const requestWaitingRoomEntry = async (
  meetingId: string,
  joinSource: string = "JOIN_CODE"
): Promise<MeetingParticipant> => {
  const response = await apiClient.post<ApiResponse<MeetingParticipant>>(
    API_ENDPOINTS.waitingRoomRequest(meetingId),
    { joinSource }
  );
  return response.data.result;
};

// POST /meetings/join/{joinCode}/waiting-room
export const requestWaitingRoomByJoinCode = async (
  joinCode: string
): Promise<MeetingParticipant> => {
  const response = await apiClient.post<ApiResponse<MeetingParticipant>>(
    API_ENDPOINTS.waitingRoomByJoinCode(joinCode)
  );
  return response.data.result;
};

// POST /invitations/{invitationId}/waiting-room
export const requestWaitingRoomByInvitation = async (
  invitationId: string
): Promise<MeetingParticipant> => {
  const response = await apiClient.post<ApiResponse<MeetingParticipant>>(
    API_ENDPOINTS.waitingRoomByInvitation(invitationId)
  );
  return response.data.result;
};

// GET /meetings/{meetingId}/my-status
export const fetchMyParticipantStatus = async (
  meetingId: string
): Promise<ApiResponse<MeetingParticipant>> => {
  const response = await apiClient.get<ApiResponse<MeetingParticipant>>(
    API_ENDPOINTS.myParticipantStatus(meetingId)
  );
  return response.data;
};

// POST /meetings/{meetingId}/join-token
export const fetchLiveKitJoinToken = async (
  meetingId: string,
  displayName?: string
): Promise<ApiResponse<LiveKitJoinToken>> => {
  const body = displayName ? { name: displayName } : {};
  const response = await apiClient.post<ApiResponse<LiveKitJoinToken>>(
    API_ENDPOINTS.joinToken(meetingId),
    body
  );
  return response.data;
};

// POST /meetings/{meetingId}/leave
export const leaveMeeting = async (meetingId: string): Promise<MeetingParticipant> => {
  const response = await apiClient.post<ApiResponse<MeetingParticipant>>(
    API_ENDPOINTS.leaveMeeting(meetingId)
  );
  return response.data.result;
};

// GET /meetings/{meetingId}/waiting-room
export const fetchWaitingRoomList = async (
  meetingId: string
): Promise<ApiResponse<PageResponse<MeetingParticipant>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<MeetingParticipant>>>(
    API_ENDPOINTS.waitingRoom(meetingId)
  );
  return response.data;
};

// PATCH /meetings/{meetingId}/waiting-room/{participantId}/approve
export const approveWaitingParticipant = async (
  meetingId: string,
  participantId: string
): Promise<MeetingParticipant> => {
  const response = await apiClient.patch<ApiResponse<MeetingParticipant>>(
    API_ENDPOINTS.waitingRoomApprove(meetingId, participantId)
  );
  return response.data.result;
};

// PATCH /meetings/{meetingId}/waiting-room/{participantId}/reject
export const rejectWaitingParticipant = async (
  meetingId: string,
  participantId: string,
  reason?: string
): Promise<MeetingParticipant> => {
  const body = reason ? { reason } : null;
  const response = await apiClient.patch<ApiResponse<MeetingParticipant>>(
    API_ENDPOINTS.waitingRoomReject(meetingId, participantId),
    body
  );
  return response.data.result;
};

// GET /meetings/{meetingId}/participants
export const fetchMeetingParticipants = async (
  meetingId: string
): Promise<ApiResponse<PageResponse<MeetingParticipant>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<MeetingParticipant>>>(
    API_ENDPOINTS.participants(meetingId)
  );
  return response.data;
};

// POST /meetings/{meetingId}/participants/{participantId}/remove
export const removeParticipant = async (
  meetingId: string,
  participantId: string
): Promise<any> => {
  const response = await apiClient.post<ApiResponse<any>>(
    API_ENDPOINTS.removeParticipant(meetingId, participantId)
  );
  return response.data;
};

// POST /meetings/{meetingId}/transcript-segments/batch
export const uploadTranscriptBatch = async (
  meetingId: string,
  data: UploadTranscriptBatchRequest
): Promise<any> => {
  const response = await apiClient.post<ApiResponse<any>>(
    API_ENDPOINTS.transcriptBatch(meetingId),
    data
  );
  return response.data.result;
};

// POST /meetings/{meetingId}/minutes/generate
export const generateMeetingMinutes = async (
  meetingId: string
): Promise<ApiResponse<MeetingMinutes>> => {
  const response = await apiClient.post<ApiResponse<MeetingMinutes>>(
    API_ENDPOINTS.generateMinutes(meetingId)
  );
  return response.data;
};

// GET /meetings/{meetingId}/minutes
export const fetchMeetingMinutes = async (
  meetingId: string
): Promise<ApiResponse<MeetingMinutes>> => {
  const response = await apiClient.get<ApiResponse<MeetingMinutes>>(
    API_ENDPOINTS.minutes(meetingId)
  );
  return response.data;
};

// PATCH /meetings/{meetingId}/minutes/publish
export const publishMeetingMinutes = async (
  meetingId: string
): Promise<ApiResponse<MeetingMinutes>> => {
  const response = await apiClient.patch<ApiResponse<MeetingMinutes>>(
    API_ENDPOINTS.publishMinutes(meetingId)
  );
  return response.data;
};

// GET /meetings/my/minutes
export const fetchMyMinutes = async (): Promise<ApiResponse<PageResponse<MeetingMinutesListItem>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<MeetingMinutesListItem>>>(
    API_ENDPOINTS.myMinutes
  );
  return response.data;
};

