import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Check,
  X,
  AlertCircle,
  Mail,
  User,
  ArrowLeft,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  useMyInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
} from "@/features/meetings/api/use-meetings";
import type { MeetingInvitation } from "@/types/entities/meeting";
import { paths } from "@/config/paths";

type FilterTab = "all" | "PENDING" | "responded";

const getDayLabel = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return "Hôm nay";
    }
    if (isYesterday(date)) {
      return "Hôm qua";
    }
    return format(date, "d/M", { locale: vi });
  } catch (e) {
    return dateStr;
  }
};

const formatTimeOnly = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "HH:mm");
  } catch (e) {
    return "";
  }
};

const formatMeetingDateTime = (dateStr?: string | null) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "HH:mm d 'thg' M, yyyy", { locale: vi });
  } catch (e) {
    return dateStr;
  }
};

const formatResponseTime = (respondedAtStr: string, sentAtStr: string) => {
  try {
    const respondedAt = new Date(respondedAtStr);
    const sentAt = new Date(sentAtStr);
    if (isSameDay(respondedAt, sentAt)) {
      return format(respondedAt, "HH:mm");
    }
    return format(respondedAt, "HH:mm d/M/yyyy");
  } catch (e) {
    return respondedAtStr;
  }
};

interface InvitationItemProps {
  invitation: MeetingInvitation;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

function InvitationItem({
  invitation,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: InvitationItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getStatusBadge = () => {
    const variants: Record<string, { variant: "default" | "outline" | "secondary" | "destructive"; label: string }> = {
      PENDING: { variant: "default", label: "Chờ phản hồi" },
      ACCEPTED: { variant: "outline", label: "Đã chấp nhận" },
      DECLINED: { variant: "secondary", label: "Đã từ chối" },
      CANCELLED: { variant: "destructive", label: "Đã hủy" },
    };

    const config = variants[invitation.status] || variants.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInviterName = () => {
    const firstName = invitation.inviterFirstName?.trim();
    const lastName = invitation.inviterLastName?.trim();
    if (firstName || lastName) {
      return `${lastName ?? ""} ${firstName ?? ""}`.trim();
    }
    return invitation.inviterId;
  };

  const getMeetingStatusLabel = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "Sắp diễn ra";
      case "ACTIVE":
        return "Đang diễn ra";
      case "ENDED":
        return "Đã kết thúc";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="py-2 shadow-none border border-neutral-400 bg-white hover:bg-neutral-50/50 transition-colors duration-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Clickable Area to Expand/Collapse details */}
            <CollapsibleTrigger asChild>
              <div className="flex-1 space-y-2 cursor-pointer select-none">
                <div className="flex items-start gap-2">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Mail className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="font-semibold text-neutral-900">
                        {invitation.meetingTitle}
                      </p>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                        {invitation.meetingType === "INSTANT" ? "Tức thì" : "Đặt lịch"}
                      </Badge>
                      <ChevronDown className={`size-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5" />
                    <span>Từ: {getInviterName()}</span>
                  </div>
                  {getStatusBadge()}
                </div>

                {invitation.respondedAt && (
                  <p className="text-[12px] text-muted-foreground font-semibold">
                    Phản hồi lúc: {formatResponseTime(invitation.respondedAt, invitation.sentAt)}
                  </p>
                )}
              </div>
            </CollapsibleTrigger>

            {/* Accept / Decline Action Buttons */}
            {invitation.status === "PENDING" && (
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDecline(invitation.id);
                  }}
                  disabled={isAccepting || isDeclining}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="mr-1.5 size-4" />
                  Từ chối
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(invitation.id);
                  }}
                  disabled={isAccepting || isDeclining}
                >
                  <Check className="mr-1.5 size-4" />
                  Chấp nhận
                </Button>
              </div>
            )}

            {invitation.status === "ACCEPTED" &&
              invitation.meetingStatus !== "CANCELLED" &&
              invitation.meetingStatus !== "ENDED" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="lg"
                    className="mr-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`${paths.app.preview.path(invitation.meetingId)}?invitationId=${invitation.id}`);
                    }}
                  >
                    Tham gia
                  </Button>
                </div>
              )}
          </div>

          {/* Details Collapsible Area */}
          <CollapsibleContent className="pt-3 border-t border-dashed border-neutral-300 space-y-2 text-sm text-neutral-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-1">
              {invitation.meetingType === "SCHEDULED" && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">Thời gian bắt đầu:</span>
                    <span>{invitation.scheduledStartAt ? formatMeetingDateTime(invitation.scheduledStartAt) : "Không có"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <span className="font-semibold">Thời gian kết thúc:</span>
                    <span>{invitation.scheduledEndAt ? formatMeetingDateTime(invitation.scheduledEndAt) : "Không có"}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-1.5 ">
                <span className="font-semibold">Trạng thái cuộc họp:</span>
                <span>{getMeetingStatusLabel(invitation.meetingStatus)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

export function InvitationListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterTab>("all");
  const { data: invitationsResponse, isLoading, error, refetch } = useMyInvitations();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  const allInvitations = invitationsResponse?.result.items ?? [];

  const handleAccept = async (id: string) => {
    try {
      await acceptInvitation.mutateAsync(id);
      toast.success("Đã chấp nhận lời mời tham gia cuộc họp!");
    } catch (err: any) {
      toast.error(err.message || "Không thể chấp nhận lời mời.");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await declineInvitation.mutateAsync(id);
      toast.success("Đã từ chối lời mời.");
    } catch (err: any) {
      toast.error(err.message || "Không thể từ chối lời mời.");
    }
  };

  const getFilteredInvitations = () => {
    switch (filter) {
      case "PENDING":
        return allInvitations.filter((inv) => inv.status === "PENDING");
      case "responded":
        return allInvitations.filter((inv) => inv.status !== "PENDING");
      default:
        return allInvitations;
    }
  };

  const filteredInvitations = getFilteredInvitations();
  const pendingCount = allInvitations.filter((inv) => inv.status === "PENDING").length;

  // Sắp xếp giảm dần theo thời gian nhận
  const sortedInvitations = [...filteredInvitations].sort((a, b) => {
    return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
  });

  // Nhóm các lời mời theo ngày gửi
  interface InvitationGroup {
    dayLabel: string;
    items: typeof sortedInvitations;
  }

  const groups: InvitationGroup[] = [];
  sortedInvitations.forEach((inv) => {
    const label = getDayLabel(inv.sentAt);
    const existingGroup = groups.find((g) => g.dayLabel === label);
    if (existingGroup) {
      existingGroup.items.push(inv);
    } else {
      groups.push({ dayLabel: label, items: [inv] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 w-full h-full">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6 w-full h-full">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Không thể tải danh sách lời mời. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(paths.app.meetings.path)}
          className="rounded-full h-9 w-9"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Lời mời</h1>
        {pendingCount > 0 && (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-white">
            {pendingCount} chờ duyệt
          </Badge>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          title="Tải lại"
          disabled={isLoading}
          className="ml-auto"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)} className="w-full">
        <TabsList className="bg-neutral-100/80">
          <TabsTrigger value="all">
            Tất cả
            {allInvitations.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({allInvitations.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="PENDING">
            Chờ phản hồi
            {pendingCount > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({pendingCount})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="responded">
            Đã phản hồi
            {allInvitations.length - pendingCount > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({allInvitations.length - pendingCount})
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.dayLabel} className="space-y-3">
              {/* Tiêu đề ngày gửi */}
              <h2 className="text-sm font-semibold text-neutral-900">
                {group.dayLabel}
              </h2>

              <div className="space-y-3">
                {group.items.map((invitation) => (
                  <div key={invitation.id} className="flex gap-4 items-start">
                    {/* Cột thời gian gửi nằm bên ngoài card (bên trái card) */}
                    <div className="text-sm text-neutral-400 w-12 pt-4 shrink-0 text-left font-medium">
                      {formatTimeOnly(invitation.sentAt)}
                    </div>

                    {/* Cột hiển thị card lời mời */}
                    <div className="flex-1 min-w-0">
                      <InvitationItem
                        invitation={invitation}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        isAccepting={acceptInvitation.isPending}
                        isDeclining={declineInvitation.isPending}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-neutral-200 rounded-lg">
          <p className="text-muted-foreground text-sm">
            {filter === "PENDING"
              ? "Không có lời mời nào đang chờ phản hồi."
              : filter === "responded"
                ? "Chưa có lời mời nào được phản hồi."
                : "Không tìm thấy lời mời nào."}
          </p>
        </div>
      )}
    </div>
  );
}
