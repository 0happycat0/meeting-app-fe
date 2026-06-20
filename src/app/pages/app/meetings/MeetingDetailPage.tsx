import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronLeft,
  Copy,
  Check,
  UserPlus,
  Users,
  CornerDownRight,
  UserX,
  Pencil,
  MoreHorizontal,
  Trash2,
  OctagonX,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/hooks/use-auth";
import {
  useMeetingDetail,
  useMeetingInvitations,
  useCreateInvitation,
  useCancelInvitation,
  useCancelMeeting,
  useEndMeeting,
} from "@/features/meetings/api/use-meetings";
import { useUsers } from "@/features/users/api/use-users";
import type { MeetingStatus, MeetingType } from "@/types/entities/meeting";
import { paths } from "@/config/paths";
import CancelMeetingDialog from "./CancelMeetingDialog";
import EndMeetingDialog from "./EndMeetingDialog";
import EditMeetingDialog from "./EditMeetingDialog";

export default function MeetingDetailPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.sub;

  // Copy State
  const [copied, setCopied] = useState(false);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);

  // Invitation Form State
  const [selectedUserId, setSelectedUserId] = useState("");

  // Queries
  const {
    data: meetingResponse,
    isLoading: isMeetingLoading,
    error: meetingError,
  } = useMeetingDetail(meetingId ?? "");

  const isHost = meetingResponse?.result?.hostId === currentUserId;

  const {
    data: invitationsResponse,
    isLoading: isInvitationsLoading,
    refetch: refetchInvitations,
  } = useMeetingInvitations(meetingId ?? "", { enabled: !!meetingId && isHost });

  const { data: usersResponse, isLoading: isUsersLoading } = useUsers();

  const createInvitationMutation = useCreateInvitation(meetingId ?? "");
  const cancelInvitationMutation = useCancelInvitation(meetingId ?? "");
  const cancelMeetingMutation = useCancelMeeting();
  const endMeetingMutation = useEndMeeting();

  // Dialog State
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const meeting = meetingResponse?.result;
  const rawInvitations = invitationsResponse?.result.items ?? [];

  // Nhóm các lời mời theo inviteeId và chỉ giữ lại lời mời mới nhất
  const latestInvitationsMap = new Map<string, (typeof rawInvitations)[number]>();
  rawInvitations.forEach((inv) => {
    const existing = latestInvitationsMap.get(inv.inviteeId);
    if (!existing) {
      latestInvitationsMap.set(inv.inviteeId, inv);
    } else {
      const existingTime = new Date(existing.sentAt || 0).getTime();
      const newTime = new Date(inv.sentAt || 0).getTime();
      if (newTime > existingTime) {
        latestInvitationsMap.set(inv.inviteeId, inv);
      }
    }
  });

  const invitations = Array.from(latestInvitationsMap.values());
  const systemUsers = usersResponse?.result.items ?? [];

  if (isMeetingLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin cuộc họp...</p>
      </div>
    );
  }

  if (meetingError || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
        <p className="text-red-500 font-semibold">Không tìm thấy cuộc họp hoặc bạn không có quyền truy cập.</p>
        <Button onClick={() => navigate(paths.app.meetings.path)}>
          <ChevronLeft className="size-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  const joinUrl = `${window.location.origin}/app/join/${meeting.joinCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    toast.success("Đã sao chép liên kết tham gia!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyJoinCode = () => {
    navigator.clipboard.writeText(meeting.joinCode);
    setCopiedJoinCode(true);
    toast.success("Đã sao chép mã tham gia cuộc họp!");
    setTimeout(() => setCopiedJoinCode(false), 2000);
  };

  const handleCancelMeeting = async () => {
    if (!meeting) return;
    try {
      await cancelMeetingMutation.mutateAsync(meeting.id);
      toast.success("Đã hủy cuộc họp thành công");
      setIsCancelDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Không thể hủy cuộc họp");
    }
  };

  const handleEndMeeting = async () => {
    if (!meeting) return;
    try {
      await endMeetingMutation.mutateAsync(meeting.id);
      toast.success("Đã kết thúc cuộc họp thành công");
      setIsEndDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Không thể kết thúc cuộc họp");
    }
  };

  const handleJoinMeeting = () => {
    navigate(`${paths.app.preview.path(meeting.id)}?joinCode=${meeting.joinCode}`);
  };

  const handleInviteUser = async () => {
    if (!selectedUserId) {
      toast.error("Vui lòng chọn thành viên để mời");
      return;
    }

    try {
      await createInvitationMutation.mutateAsync(selectedUserId);
      toast.success("Gửi lời mời thành công!");
      setSelectedUserId("");
      refetchInvitations();
    } catch (error: any) {
      toast.error(error.message || "Không thể mời thành viên này.");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitationMutation.mutateAsync(invitationId);
      toast.success("Đã thu hồi lời mời thành công");
      refetchInvitations();
    } catch (error: any) {
      toast.error(error.message || "Không thể thu hồi lời mời");
    }
  };

  // Helper to get user display details
  const getUserDetails = (userId: string) => {
    const found = systemUsers.find((u) => u.id === userId);
    if (found) {
      return {
        fullName: `${found.lastName} ${found.firstName}`,
        email: found.email,
        username: found.username,
      };
    }
    return {
      fullName: "Thành viên hệ thống",
      email: "—",
      username: "—",
    };
  };

  const getHostNameText = () => {
    if (isHost) return "Tôi";
    if (meeting.hostLastName || meeting.hostFirstName) {
      return `${meeting.hostLastName ?? ""} ${meeting.hostFirstName ?? ""}`.trim();
    }
    const details = getUserDetails(meeting.hostId);
    return details.fullName !== "Thành viên hệ thống" ? details.fullName : meeting.hostId;
  };

  const renderStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Đang diễn ra</Badge>;
      case "SCHEDULED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30"
          >
            Sắp diễn ra
          </Badge>
        );
      case "ENDED":
        return <Badge variant="secondary">Đã kết thúc</Badge>;
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30"
          >
            Đã hủy
          </Badge>
        );
      default:
        return null;
    }
  };

  // Lọc danh sách người dùng khả dụng để mời (loại trừ host và các lời mời đang hoạt động/chờ duyệt, cho phép mời lại nếu trạng thái là CANCELLED)
  const eligibleUsers = systemUsers.filter((u) => {
    if (!meeting) return false;
    if (u.id === meeting.hostId) return false;
    const userInv = latestInvitationsMap.get(u.id);
    return !userInv || userInv.status === "CANCELLED";
  });

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(paths.app.meetings.path)}
        >
          <ChevronLeft className="size-4 mr-2" /> Quay lại
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {isHost ? (
          <div className="space-y-6 pb-6">
            {/* Title block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 font-sans">
                  {meeting.title}
                </h1>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {meeting.meetingType === "INSTANT" ? "Tức thì" : "Đặt lịch"}
                  </Badge>
                  {renderStatusBadge(meeting.status)}
                </div>
              </div>

              {/* Actions & Join button */}
              <div className="flex items-center gap-3 shrink-0">
                {meeting.status !== "CANCELLED" && meeting.status !== "ENDED" && (
                  <Button
                    size="lg"
                    onClick={handleJoinMeeting}
                    className="shadow-lg"
                  >
                    <CornerDownRight className="size-5 mr-2" />
                    Tham gia
                  </Button>
                )}
                {isHost && (meeting.status === "ACTIVE" || meeting.status === "SCHEDULED") && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-5 text-neutral-600 dark:text-neutral-300" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-white border border-neutral-200 text-neutral-900 shadow-md">
                      <DropdownMenuItem
                        onClick={() => setIsEditDialogOpen(true)}
                        className="cursor-pointer font-semibold text-xs text-neutral-700 hover:bg-neutral-50"
                      >
                        <Pencil className="size-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>

                      {meeting.status === "SCHEDULED" && (
                        <>
                          <DropdownMenuSeparator className="border-neutral-100" />
                          <DropdownMenuItem
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer font-semibold text-xs"
                            onClick={() => setIsCancelDialogOpen(true)}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Hủy lịch
                          </DropdownMenuItem>
                        </>
                      )}

                      {meeting.status === "ACTIVE" && (
                        <>
                          <DropdownMenuSeparator className="border-neutral-100" />
                          <DropdownMenuItem
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer font-semibold text-xs"
                            onClick={() => setIsEndDialogOpen(true)}
                          >
                            <OctagonX className="size-4 mr-2" />
                            Kết thúc
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            <hr className="border-neutral-100 dark:border-neutral-800" />

            <div className="grid grid-cols-1 lg:grid-cols-16 gap-6 items-start">
              {/* Left Column: Meeting Details */}
              <div className="lg:col-span-11 space-y-6">

                {/* Description & dates info */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className={`${meeting.meetingType === "SCHEDULED" ? "md:col-span-3" : "md:col-span-4"} space-y-2`}>
                    <Label className="text-sm font-medium">Mô tả</Label>
                    <p className="text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
                      {meeting.description || "Không có mô tả cuộc họp."}
                    </p>
                  </div>
                  {meeting.meetingType === "SCHEDULED" && (
                    <div className="space-y-4 md:border-l md:border-neutral-100 md:dark:border-neutral-800 md:pl-4 col-span-1 md:col-span-1">
                      {meeting.scheduledStartAt && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Thời gian bắt đầu</Label>
                          <p className="text-neutral-900 dark:text-neutral-100 text-xs">
                            {format(new Date(meeting.scheduledStartAt), "HH:mm d 'thg' M, yyyy", { locale: vi })}
                          </p>
                        </div>
                      )}
                      {meeting.scheduledEndAt && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Thời gian kết thúc</Label>
                          <p className="text-neutral-900 dark:text-neutral-100 text-xs">
                            {format(new Date(meeting.scheduledEndAt), "HH:mm d 'thg' M, yyyy", { locale: vi })}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-4 md:border-l md:border-neutral-100 md:dark:border-neutral-800 md:pl-4 col-span-1 md:col-span-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Chủ trì</Label>
                      <p className="text-neutral-800 dark:text-neutral-200 text-sm font-semibold">
                        {getHostNameText()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Ngày tạo</Label>
                      <p className="text-neutral-800 dark:text-neutral-200 text-xs">
                        {format(new Date(meeting.createdAt), "HH:mm d 'thg' M, yyyy", { locale: vi })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Join Info */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Thông tin tham gia</h2>
                  <Card className="border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10">
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-400 font-medium">Mã tham gia</Label>
                        <div className="flex items-center gap-2">
                          <div className="inline-block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 font-mono text-xl font-bold tracking-[0.2em] text-neutral-950 dark:text-neutral-50 shadow-sm">
                            {meeting.joinCode.split("").join(" ")}
                          </div>
                          <Button size="icon" variant="outline" onClick={handleCopyJoinCode} className="h-10 w-10">
                            {copiedJoinCode ? (
                              <Check className="size-4 text-green-500" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-400 font-medium">Link tham gia</Label>
                        <div className="flex gap-2 max-w-xl">
                          <Input readOnly value={joinUrl} className="bg-white dark:bg-neutral-900 font-mono text-xs h-9" />
                          <Button size="icon" variant="outline" onClick={handleCopyLink} className="h-9 w-9 shrink-0">
                            {copied ? (
                              <Check className="size-4 text-green-500" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column: Invitations & Invite Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-neutral-500" />
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Người được mời</h2>
                  </div>

                  {/* Invited list with scroll limit */}
                  <ScrollArea className="border border-neutral-100 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900/50 max-h-[220px]">
                    {isInvitationsLoading ? (
                      <div className="flex items-center justify-center p-8 space-y-2">
                        <Spinner className="size-4" />
                        <span className="text-xs text-muted-foreground ml-2">Đang tải danh sách lời mời...</span>
                      </div>
                    ) : invitations.length === 0 ? (
                      <div className="p-8 text-center text-sm text-neutral-400">
                        Chưa có thành viên nào được mời tham gia cuộc họp này.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="sticky top-0 bg-white dark:bg-neutral-950 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                          <TableRow>
                            <TableHead className="font-medium text-xs py-2">Thành viên</TableHead>
                            <TableHead className="font-medium text-xs py-2">Email</TableHead>
                            <TableHead className="font-medium text-xs py-2">Trạng thái</TableHead>
                            <TableHead className="w-[80px] py-2"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invitations.map((inv) => {
                            const userDetail = getUserDetails(inv.inviteeId);
                            return (
                              <TableRow key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20">
                                <TableCell className="font-medium py-2">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                                      {userDetail.fullName}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">@{userDetail.username}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-neutral-600 dark:text-neutral-300 py-2">
                                  {userDetail.email}
                                </TableCell>
                                <TableCell className="py-2">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${inv.status === "PENDING"
                                        ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400"
                                        : inv.status === "ACCEPTED"
                                          ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400"
                                          : inv.status === "DECLINED"
                                            ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
                                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                                      }`}
                                  >
                                    {inv.status === "PENDING"
                                      ? "Đang chờ"
                                      : inv.status === "ACCEPTED"
                                        ? "Đã đồng ý"
                                        : inv.status === "DECLINED"
                                          ? "Đã từ chối"
                                          : "Đã hủy"}
                                  </span>
                                </TableCell>
                                <TableCell className="py-2 text-right">
                                  {inv.status === "PENDING" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 text-[10px] px-2"
                                      onClick={() => handleCancelInvitation(inv.id)}
                                    >
                                      Thu hồi
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>

                  {/* Host invitation form */}
                  {(meeting.status === "SCHEDULED" || meeting.status === "ACTIVE") && (
                    <Card className="border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 mt-4">
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 text-xs">
                          <UserPlus className="size-4" /> Mời thêm thành viên
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                          <div className="flex-1">
                            <Select
                              value={selectedUserId}
                              onValueChange={setSelectedUserId}
                              disabled={isUsersLoading || createInvitationMutation.isPending}
                            >
                              <SelectTrigger className="w-full bg-white dark:bg-neutral-950 h-9 text-xs">
                                <SelectValue placeholder="Chọn thành viên..." />
                              </SelectTrigger>
                              <SelectContent>
                                {eligibleUsers.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    Không có thành viên khả dụng để mời
                                  </SelectItem>
                                ) : (
                                  eligibleUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id} className="text-xs">
                                      {user.lastName} {user.firstName} ({user.email})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleInviteUser}
                            disabled={!selectedUserId || createInvitationMutation.isPending}
                            className="h-9 text-xs"
                          >
                            Mời
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-6 pb-6">
            {/* Title block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50 font-sans">
                  {meeting.title}
                </h1>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {meeting.meetingType === "INSTANT" ? "Tức thì" : "Đặt lịch"}
                  </Badge>
                  {renderStatusBadge(meeting.status)}
                </div>
              </div>

              {/* Join button */}
              {meeting.status !== "CANCELLED" && meeting.status !== "ENDED" && (
                <Button
                  size="lg"
                  onClick={handleJoinMeeting}
                  className="shadow-lg shrink-0"
                >
                  <CornerDownRight className="size-5 mr-2" />
                  Tham gia
                </Button>
              )}
            </div>

            <hr className="border-neutral-100 dark:border-neutral-800" />

            {/* Description & dates info */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
              <div className={`${meeting.meetingType === "SCHEDULED" ? "md:col-span-5" : "md:col-span-6"} space-y-2`}>
                <Label className="text-sm font-medium">Mô tả</Label>
                <p className="text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {meeting.description || "Không có mô tả cuộc họp."}
                </p>
              </div>
              {meeting.meetingType === "SCHEDULED" && (
                <div className="space-y-4 md:border-l md:border-neutral-100 md:dark:border-neutral-800 md:pl-4 col-span-2 md:col-span-1">
                  {meeting.scheduledStartAt && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Thời gian bắt đầu</Label>
                      <p className="text-neutral-900 dark:text-neutral-100 text-xs">
                        {format(new Date(meeting.scheduledStartAt), "HH:mm d 'thg' M, yyyy", { locale: vi })}
                      </p>
                    </div>
                  )}
                  {meeting.scheduledEndAt && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Thời gian kết thúc</Label>
                      <p className="text-neutral-900 dark:text-neutral-100 text-xs">
                        {format(new Date(meeting.scheduledEndAt), "HH:mm d 'thg' M, yyyy", { locale: vi })}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-4 md:border-l md:border-neutral-100 md:dark:border-neutral-800 md:pl-4 col-span-2 md:col-span-1">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Chủ trì</Label>
                  <p className="text-neutral-800 dark:text-neutral-200 text-sm font-semibold">
                    {getHostNameText()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Ngày tạo</Label>
                  <p className="text-neutral-800 dark:text-neutral-200 text-xs">
                    {format(new Date(meeting.createdAt), "HH:mm d 'thg' M, yyyy", { locale: vi })}
                  </p>
                </div>
              </div>
            </div>

            {/* Join Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Thông tin tham gia</h2>
              <Card className="border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-neutral-400 font-medium">Mã tham gia</Label>
                    <div className="flex items-center gap-2">
                      <div className="inline-block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2.5 font-mono text-xl font-bold tracking-[0.2em] text-neutral-950 dark:text-neutral-50 shadow-sm">
                        {meeting.joinCode.split("").join(" ")}
                      </div>
                      <Button size="icon" variant="outline" onClick={handleCopyJoinCode} className="h-[46px] w-[46px]">
                        {copiedJoinCode ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-neutral-400 font-medium">Link tham gia</Label>
                    <div className="flex gap-2 max-w-xl">
                      <Input readOnly value={joinUrl} className="bg-white dark:bg-neutral-900 font-mono text-xs h-9" />
                      <Button size="icon" variant="outline" onClick={handleCopyLink} className="h-9 w-9 shrink-0">
                        {copied ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {meeting && (
        <>
          <CancelMeetingDialog
            open={isCancelDialogOpen}
            onOpenChange={setIsCancelDialogOpen}
            meeting={meeting}
            onConfirm={handleCancelMeeting}
            isLoading={cancelMeetingMutation.isPending}
          />
          <EndMeetingDialog
            open={isEndDialogOpen}
            onOpenChange={setIsEndDialogOpen}
            meeting={meeting}
            onConfirm={handleEndMeeting}
            isLoading={endMeetingMutation.isPending}
          />
          <EditMeetingDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            meeting={meeting}
          />
        </>
      )}
    </div>
  );
}
