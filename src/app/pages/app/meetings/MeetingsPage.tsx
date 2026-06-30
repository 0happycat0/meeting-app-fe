import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  Video,
  Plus,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  SquarePlay,
  Eye,
  Mail,
  OctagonX,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/use-auth";
import {
  useMyMeetings,
  useCancelMeeting,
  useEndMeeting,
  useMyInvitations,
} from "@/features/meetings/api/use-meetings";
import { resolveJoinCode } from "@/features/meetings/api/meetings";
import type { Meeting, MeetingStatus, MeetingType } from "@/types/entities/meeting";
import CreateMeetingDialog from "./CreateMeetingDialog";
import CancelMeetingDialog from "./CancelMeetingDialog";
import EndMeetingDialog from "./EndMeetingDialog";
import EditMeetingDialog from "./EditMeetingDialog";
import { paths } from "@/config/paths";

export default function MeetingsPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.sub;

  // State
  const [activeTab, setActiveTab] = useState<"ALL" | MeetingStatus>("ALL");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isResolvingJoinCode, setIsResolvingJoinCode] = useState(false);

  // Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dialogMeetingType, setDialogMeetingType] = useState<MeetingType>("INSTANT");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // React Query Hooks
  const { data: meetingsResponse, isLoading, refetch } = useMyMeetings();
  const cancelMeetingMutation = useCancelMeeting();
  const endMeetingMutation = useEndMeeting();
  const { data: invitationsResponse } = useMyInvitations();

  const pendingCount =
    invitationsResponse?.result.items.filter((inv) => inv.status === "PENDING").length ?? 0;

  const meetings = meetingsResponse?.result.items ?? [];

  // Filter meetings based on active tab
  const filteredMeetings = meetings.filter((meeting) => {
    if (activeTab === "ALL") return true;
    return meeting.status === activeTab;
  });

  // Handle Join Code Submission
  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setIsResolvingJoinCode(true);
    try {
      const response = await resolveJoinCode(joinCodeInput);
      const meetingInfo = response.result;

      navigate(`${paths.app.join.path(joinCodeInput)}`);
    } catch (error: any) {
      toast.error(error.message || "Mã tham gia không hợp lệ hoặc cuộc họp đã kết thúc.");
    } finally {
      setIsResolvingJoinCode(false);
    }
  };

  const handleOpenCreateDialog = (type: MeetingType) => {
    setDialogMeetingType(type);
    setIsCreateDialogOpen(true);
  };

  const handleCancelMeeting = async () => {
    if (!selectedMeeting) return;
    try {
      await cancelMeetingMutation.mutateAsync(selectedMeeting.id);
      toast.success("Đã hủy cuộc họp thành công");
      setIsCancelDialogOpen(false);
      setSelectedMeeting(null);
    } catch (error: any) {
      toast.error(error.message || "Không thể hủy cuộc họp");
    }
  };

  const handleEndMeeting = async () => {
    if (!selectedMeeting) return;
    try {
      await endMeetingMutation.mutateAsync(selectedMeeting.id);
      toast.success("Đã kết thúc cuộc họp thành công");
      setIsEndDialogOpen(false);
      setSelectedMeeting(null);
    } catch (error: any) {
      toast.error(error.message || "Không thể kết thúc cuộc họp");
    }
  };

  // Format date display
  const renderTimeCell = (meeting: Meeting) => {
    if (meeting.meetingType === "INSTANT") {
      return <span className="text-muted-foreground">—</span>;
    }

    const start = meeting.scheduledStartAt;
    const end = meeting.scheduledEndAt;
    if (!start) return <span className="text-muted-foreground">—</span>;

    const startDate = new Date(start);
    const formattedStart = format(startDate, "HH:mm d 'thg' M, yyyy", { locale: vi });

    if (!end) return <div>{formattedStart}</div>;

    const endDate = new Date(end);
    const formattedEnd = format(endDate, "HH:mm d 'thg' M, yyyy", { locale: vi });

    return (
      <div className="flex flex-col text-sm text-neutral-600 dark:text-neutral-300">
        <span>{formattedStart}</span>
        <span>{formattedEnd}</span>
      </div>
    );
  };

  // Badges rendering
  const renderTypeBadge = (type: MeetingType) => {
    return (
      <Badge variant="secondary">
        {type === "INSTANT" ? "Tức thì" : "Đặt lịch"}
      </Badge>
    );
  };

  const renderStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge>Đang diễn ra</Badge>;

      case "SCHEDULED":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Sắp diễn ra
          </Badge>
        );

      case "ENDED":
        return <Badge variant="secondary">Đã kết thúc</Badge>;

      case "CANCELLED":
        return <Badge variant="destructive">Đã hủy</Badge>;

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Cuộc họp</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Join Form */}
          <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
            <Input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Mã tham gia (XXXX-XXXX)"
              className="w-48 bg-white dark:bg-neutral-900"
              maxLength={9}
              disabled={isResolvingJoinCode}
            />
            <Button type="submit" size="icon" variant="outline" disabled={isResolvingJoinCode || joinCodeInput.trim().length !== 9}>
              {isResolvingJoinCode ? <Spinner className="size-4" /> : <ArrowRight className="size-4" />}
            </Button>
          </form>

          {/* Refresh Button */}
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Tải lại" disabled={isLoading}>
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          {/* Create Buttons */}
          <Button variant="outline" onClick={() => handleOpenCreateDialog("SCHEDULED")}>
            <Calendar className="size-4 mr-2" />
            Lên lịch
          </Button>
          <Button onClick={() => handleOpenCreateDialog("INSTANT")}>
            <Plus className="size-4 mr-2" />
            Tạo nhanh
          </Button>
        </div>
      </div>

      {/* Tabs / Filters & Lời mời */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "ALL" | MeetingStatus)}
          className="w-full sm:w-auto"
        >
          <TabsList className="bg-neutral-100/80 dark:bg-neutral-900/80 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="ALL">Tất cả ({meetings.length})</TabsTrigger>
            <TabsTrigger value="ACTIVE">
              Đang diễn ra ({meetings.filter((m) => m.status === "ACTIVE").length})
            </TabsTrigger>
            <TabsTrigger value="SCHEDULED">
              Sắp tới ({meetings.filter((m) => m.status === "SCHEDULED").length})
            </TabsTrigger>
            <TabsTrigger value="ENDED">
              Đã kết thúc ({meetings.filter((m) => m.status === "ENDED").length})
            </TabsTrigger>
            <TabsTrigger value="CANCELLED">
              Đã huỷ ({meetings.filter((m) => m.status === "CANCELLED").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          onClick={() => navigate(paths.app.invitations.path)}
        >
          <Mail className="size-4" />
          Lời mời của tôi
          {pendingCount > 0 && (
            <Badge variant="default" className="ml-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full px-1.5 py-0.5 text-[10px]">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Meeting Table */}
      <div className="border border-neutral-100 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900/50 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground">Đang tải danh sách cuộc họp...</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
            <div className="p-4 rounded-full bg-neutral-50 dark:bg-neutral-900">
              <Video className="size-8 text-neutral-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Không tìm thấy cuộc họp</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Bạn chưa có cuộc họp nào trong mục này. Bắt đầu bằng cách tạo cuộc họp nhanh hoặc lên lịch.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%] font-medium">Tên cuộc họp</TableHead>
                <TableHead className="font-medium">Loại</TableHead>
                <TableHead className="font-medium">Trạng thái</TableHead>
                <TableHead className="font-medium">Thời gian</TableHead>
                <TableHead className="font-medium">Vai trò</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.map((meeting) => {
                const isHost = meeting.hostId === currentUserId;
                return (
                  <TableRow
                    key={meeting.id}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 cursor-pointer"
                    onClick={() => navigate(paths.app.meetingDetails.path(meeting.id))}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
                          {meeting.title}
                        </span>
                        {meeting.description && (
                          <span className="text-xs text-muted-foreground font-normal line-clamp-1 mt-0.5">
                            {meeting.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{renderTypeBadge(meeting.meetingType)}</TableCell>
                    <TableCell>{renderStatusBadge(meeting.status)}</TableCell>
                    <TableCell>{renderTimeCell(meeting)}</TableCell>
                    <TableCell>
                      {isHost ? (
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/50">
                          Chủ trì
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Thành viên
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(paths.app.meetingDetails.path(meeting.id))}>
                            <Eye className="size-4 mr-2" />
                            Chi tiết
                          </DropdownMenuItem>

                          {(meeting.status === "ACTIVE" || meeting.status === "SCHEDULED") && (
                            <DropdownMenuItem
                              className="text-green-600 dark:text-green-400"
                              onClick={() => navigate(paths.app.preview.path(meeting.joinCode))}
                            >
                              <SquarePlay className="size-4 mr-2" />
                              Tham gia
                            </DropdownMenuItem>
                          )}

                          {isHost && (
                            <>
                              {meeting.status !== "ENDED" && <DropdownMenuSeparator />}
                              
                              {(meeting.status === "SCHEDULED" || meeting.status === "ACTIVE") && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedMeeting(meeting);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="size-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                              )}

                              {meeting.status === "SCHEDULED" && (
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => {
                                    setSelectedMeeting(meeting);
                                    setIsCancelDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  Hủy lịch
                                </DropdownMenuItem>
                              )}
                              {meeting.status === "ACTIVE" && (
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => {
                                    setSelectedMeeting(meeting);
                                    setIsEndDialogOpen(true);
                                  }}
                                >
                                  <OctagonX className="size-4 mr-2" />
                                  Kết thúc
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Schedule Dialog */}
      <CreateMeetingDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialType={dialogMeetingType}
      />

      {/* Cancel Meeting Dialog */}
      <CancelMeetingDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        meeting={selectedMeeting}
        onConfirm={handleCancelMeeting}
        isLoading={cancelMeetingMutation.isPending}
      />

      {/* End Meeting Dialog */}
      <EndMeetingDialog
        open={isEndDialogOpen}
        onOpenChange={setIsEndDialogOpen}
        meeting={selectedMeeting}
        onConfirm={handleEndMeeting}
        isLoading={endMeetingMutation.isPending}
      />

      {/* Edit Meeting Dialog */}
      <EditMeetingDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        meeting={selectedMeeting}
      />
    </div>
  );
}
