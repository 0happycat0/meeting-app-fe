import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMeeting,
  fetchMyMeetings,
  fetchMeetingDetail,
  resolveJoinCode,
  updateMeeting,
  cancelMeeting,
  endMeeting,
  createInvitation,
  fetchMeetingInvitations,
  fetchMyInvitations,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
  requestWaitingRoomEntry,
  requestWaitingRoomByJoinCode,
  requestWaitingRoomByInvitation,
  fetchMyParticipantStatus,
  fetchLiveKitJoinToken,
  leaveMeeting,
  fetchWaitingRoomList,
  approveWaitingParticipant,
  rejectWaitingParticipant,
  fetchMeetingParticipants,
  removeParticipant,
  type CreateMeetingRequest,
  type UpdateMeetingRequest,
  type GetMyMeetingsParams,
} from "./meetings";
import type { ApiError } from "@/types/error";
import type {
  Meeting,
  JoinMeeting,
  MeetingInvitation,
  MeetingParticipant,
  LiveKitJoinToken,
} from "@/types/entities/meeting";
import type { ApiResponse, PageResponse } from "@/types/api";

export const MEETINGS_QUERY_KEYS = {
  all: ["meetings"] as const,
  my: (params?: GetMyMeetingsParams) => ["meetings", "my", params ?? {}] as const,
  detail: (id: string) => ["meetings", "detail", id] as const,
  join: (joinCode: string) => ["meetings", "join", joinCode] as const,
};

// Hook tạo cuộc họp mới (Mutation)
export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation<Meeting, ApiError, CreateMeetingRequest>({
    mutationFn: createMeeting,
    onSuccess: (newMeeting) => {
      // Invalidate danh sách cuộc họp của tôi
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
    },
  });
}

// Hook lấy danh sách cuộc họp của tôi (Query)
export function useMyMeetings(params?: GetMyMeetingsParams) {
  return useQuery<ApiResponse<PageResponse<Meeting>>, ApiError>({
    queryKey: MEETINGS_QUERY_KEYS.my(params),
    queryFn: () => fetchMyMeetings(params),
  });
}

// Hook lấy chi tiết cuộc họp (Query)
export function useMeetingDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<Meeting>, ApiError>({
    queryKey: MEETINGS_QUERY_KEYS.detail(id),
    queryFn: () => fetchMeetingDetail(id),
    enabled: options?.enabled !== false && !!id,
  });
}

// Hook resolve join code (Query)
export function useResolveJoinCode(joinCode: string, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<JoinMeeting>, ApiError>({
    queryKey: MEETINGS_QUERY_KEYS.join(joinCode),
    queryFn: () => resolveJoinCode(joinCode),
    enabled: options?.enabled !== false && !!joinCode,
    retry: false, // Thường không retry khi mã join code không hợp lệ
  });
}

// Hook cập nhật cuộc họp (Mutation)
export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation<Meeting, ApiError, { id: string; data: UpdateMeetingRequest }>({
    mutationFn: ({ id, data }) => updateMeeting(id, data),
    onSuccess: (updatedMeeting) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: MEETINGS_QUERY_KEYS.detail(updatedMeeting.id),
      });
    },
  });
}

// Hook hủy cuộc họp (Mutation)
export function useCancelMeeting() {
  const queryClient = useQueryClient();
  return useMutation<Meeting, ApiError, string>({
    mutationFn: cancelMeeting,
    onSuccess: (updatedMeeting) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: MEETINGS_QUERY_KEYS.detail(updatedMeeting.id),
      });
    },
  });
}

// Hook kết thúc cuộc họp (Mutation)
export function useEndMeeting() {
  const queryClient = useQueryClient();
  return useMutation<Meeting, ApiError, string>({
    mutationFn: endMeeting,
    onSuccess: (updatedMeeting) => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: MEETINGS_QUERY_KEYS.detail(updatedMeeting.id),
      });
    },
  });
}

// Hook mời thành viên tham gia (Mutation)
export function useCreateInvitation(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation<MeetingInvitation, ApiError, string>({
    mutationFn: (inviteeId) => createInvitation(meetingId, inviteeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "invitations", meetingId],
      });
    },
  });
}

// Hook danh sách lời mời của một cuộc họp (Query)
export function useMeetingInvitations(meetingId: string, options?: { enabled?: boolean }) {
  return useQuery<ApiResponse<PageResponse<MeetingInvitation>>, ApiError>({
    queryKey: ["meetings", "invitations", meetingId],
    queryFn: () => fetchMeetingInvitations(meetingId),
    enabled: options?.enabled !== false && !!meetingId,
  });
}

// Hook danh sách lời mời của tôi (Query)
export function useMyInvitations() {
  return useQuery<ApiResponse<PageResponse<MeetingInvitation>>, ApiError>({
    queryKey: ["meetings", "my-invitations"],
    queryFn: fetchMyInvitations,
  });
}

// Hook chấp nhận lời mời (Mutation)
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation<MeetingInvitation, ApiError, string>({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["meetings", "my-invitations"] });
    },
  });
}

// Hook từ chối lời mời (Mutation)
export function useDeclineInvitation() {
  const queryClient = useQueryClient();
  return useMutation<MeetingInvitation, ApiError, string>({
    mutationFn: declineInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["meetings", "my-invitations"] });
    },
  });
}

// Hook hủy lời mời (Mutation)
export function useCancelInvitation(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation<MeetingInvitation, ApiError, string>({
    mutationFn: cancelInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "invitations", meetingId],
      });
    },
  });
}

// Hook yêu cầu vào phòng chờ (Mutation)
export function useRequestWaitingRoomEntry(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation<MeetingParticipant, ApiError, string | undefined>({
    mutationFn: (joinSource) => requestWaitingRoomEntry(meetingId, joinSource),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "participant-status", meetingId],
      });
    },
  });
}

// Hook yêu cầu vào phòng chờ bằng join code (Mutation)
export function useRequestWaitingRoomByJoinCode() {
  const queryClient = useQueryClient();
  return useMutation<MeetingParticipant, ApiError, string>({
    mutationFn: requestWaitingRoomByJoinCode,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "participant-status", data.meetingId],
      });
    },
  });
}

// Hook yêu cầu vào phòng chờ bằng invitationId (Mutation)
export function useRequestWaitingRoomByInvitation() {
  const queryClient = useQueryClient();
  return useMutation<MeetingParticipant, ApiError, string>({
    mutationFn: requestWaitingRoomByInvitation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "participant-status", data.meetingId],
      });
    },
  });
}

// Hook kiểm tra trạng thái phòng chờ của bản thân (Query có hỗ trợ Polling)
export function useMyParticipantStatus(
  meetingId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery<ApiResponse<MeetingParticipant>, ApiError>({
    queryKey: ["meetings", "participant-status", meetingId],
    queryFn: () => fetchMyParticipantStatus(meetingId),
    enabled: options?.enabled !== false && !!meetingId,
    refetchInterval: options?.refetchInterval ?? false,
    retry: false,
  });
}

// Hook lấy token LiveKit (Mutation hoặc Query)
export function useLiveKitJoinToken(meetingId: string) {
  return useMutation<ApiResponse<LiveKitJoinToken>, ApiError, string | undefined>({
    mutationFn: (displayName) => fetchLiveKitJoinToken(meetingId, displayName),
  });
}

// Hook rời cuộc họp (Mutation)
export function useLeaveMeeting(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation<MeetingParticipant, ApiError, void>({
    mutationFn: () => leaveMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "participant-status", meetingId],
      });
    },
  });
}

// Hook lấy danh sách phòng chờ cho Host (Query có hỗ trợ Polling)
export function useWaitingRoomList(
  meetingId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery<ApiResponse<PageResponse<MeetingParticipant>>, ApiError>({
    queryKey: ["meetings", "waiting-room-list", meetingId],
    queryFn: () => fetchWaitingRoomList(meetingId),
    enabled: options?.enabled !== false && !!meetingId,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

// Hook duyệt người tham gia (Mutation)
export function useApproveWaitingParticipant(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation<MeetingParticipant, ApiError, string>({
    mutationFn: (participantId) => approveWaitingParticipant(meetingId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "waiting-room-list", meetingId],
      });
    },
  });
}

// Hook từ chối người tham gia (Mutation)
export function useRejectWaitingParticipant(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation<MeetingParticipant, ApiError, { participantId: string; reason?: string }>({
    mutationFn: ({ participantId, reason }) =>
      rejectWaitingParticipant(meetingId, participantId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "waiting-room-list", meetingId],
      });
    },
  });
}

// Hook lấy danh sách thành viên trong cuộc họp
export function useMeetingParticipants(meetingId: string, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery<ApiResponse<PageResponse<MeetingParticipant>>, ApiError>({
    queryKey: ["meetings", "participants", meetingId],
    queryFn: () => fetchMeetingParticipants(meetingId),
    enabled: options?.enabled !== false && !!meetingId,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

// Hook xóa thành viên khỏi cuộc họp (Host)
export function useRemoveParticipant(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation<any, ApiError, string>({
    mutationFn: (participantId) => removeParticipant(meetingId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["meetings", "participants", meetingId],
      });
    },
  });
}
