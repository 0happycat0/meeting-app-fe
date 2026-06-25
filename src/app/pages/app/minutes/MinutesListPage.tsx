import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  FileText,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/hooks/use-auth";
import { useMyMinutes } from "@/features/meetings/api/use-meetings";
import type { MeetingMinutesListItem } from "@/types/entities/meeting";
import { paths } from "@/config/paths";

export default function MinutesListPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.sub;
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // React Query Hooks (Get my meeting minutes list)
  const { data: minutesResponse, isLoading, refetch, isFetching } = useMyMinutes();
  const meetings = minutesResponse?.result.items ?? [];

  // Sort meetings by scheduledStartAt or generatedAt descending
  const sortedMeetings = [...meetings].sort((a, b) => {
    const timeA = new Date(a.scheduledStartAt || a.generatedAt || 0).getTime();
    const timeB = new Date(b.scheduledStartAt || b.generatedAt || 0).getTime();
    return timeB - timeA;
  });

  const filteredMeetings = sortedMeetings.filter((meeting) => {
    if (activeTab === "ALL") return true;
    return meeting.minutesStatus === activeTab;
  });

  const renderTypeBadge = (scheduledStartAt: string | null) => {
    return (
      <Badge variant="secondary">
        {scheduledStartAt ? "Đặt lịch" : "Tức thì"}
      </Badge>
    );
  };

  const renderTimeCell = (meeting: MeetingMinutesListItem) => {
    const start = meeting.scheduledStartAt || meeting.generatedAt;
    if (!start) return <span className="text-muted-foreground">—</span>;

    const startDate = new Date(start);
    const formattedStart = format(startDate, "HH:mm d 'thg' M, yyyy", { locale: vi });
    return <span className="text-sm text-neutral-600 dark:text-neutral-300">{formattedStart}</span>;
  };

  const renderMinutesStatusBadge = (meeting: MeetingMinutesListItem) => {
    const status = meeting.minutesStatus;
    switch (status) {
      case "COMPLETED":
        return meeting.published ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-150 border-green-200">
            Đã công bố
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-150 border-yellow-200">
            Bản nháp
          </Badge>
        );
      case "GENERATING":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-150 border-blue-200 animate-pulse">
            Đang tạo...
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-150 border-red-200">
            Thất bại
          </Badge>
        );
      case "NONE":
      default:
        return (
          <Badge variant="secondary" className="bg-neutral-100 text-neutral-800 border-neutral-200">
            Chưa tạo
          </Badge>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biên bản cuộc họp</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem và quản lý tóm tắt biên bản cuộc họp bằng AI
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Tải lại" disabled={isLoading || isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="ALL">Tất cả ({sortedMeetings.length})</TabsTrigger>
          <TabsTrigger value="COMPLETED">
            Đã có biên bản ({sortedMeetings.filter((m) => m.minutesStatus === "COMPLETED").length})
          </TabsTrigger>
          <TabsTrigger value="NONE">
            Chưa có biên bản ({sortedMeetings.filter((m) => m.minutesStatus === "NONE").length})
          </TabsTrigger>
          <TabsTrigger value="GENERATING">
            Đang tạo ({sortedMeetings.filter((m) => m.minutesStatus === "GENERATING").length})
          </TabsTrigger>
          <TabsTrigger value="FAILED">
            Lỗi ({sortedMeetings.filter((m) => m.minutesStatus === "FAILED").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Meeting Table */}
      <div className="border border-neutral-100 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900/50 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground">Đang tải danh sách cuộc họp đã kết thúc...</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
            <div className="p-4 rounded-full bg-neutral-50 dark:bg-neutral-900">
              <FileText className="size-8 text-neutral-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Không tìm thấy cuộc họp nào</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Không có cuộc họp nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          </div>
        ) : (
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] font-medium">Tên cuộc họp</TableHead>
                <TableHead className="font-medium">Loại</TableHead>
                <TableHead className="font-medium">Trạng thái biên bản</TableHead>
                <TableHead className="font-medium">Người chủ trì</TableHead>
                <TableHead className="font-medium">Thời gian diễn ra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.map((meeting) => {
                const isHost = meeting.hostId === currentUserId;
                const hostName = [meeting.hostLastName, meeting.hostFirstName].filter(Boolean).join(" ").trim() || "Chưa rõ";
                return (
                  <TableRow 
                    key={meeting.meetingId}
                    onClick={() => navigate(paths.app.minutesDetails.path(meeting.meetingId))}
                    className="cursor-pointer hover:bg-neutral-50/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col py-0.5">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">
                          {meeting.meetingTitle}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {meeting.meetingDescription || "\u00A0"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{renderTypeBadge(meeting.scheduledStartAt)}</TableCell>
                    <TableCell>{renderMinutesStatusBadge(meeting)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {isHost ? "Tôi" : hostName}
                      </span>
                    </TableCell>
                    <TableCell>{renderTimeCell(meeting)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
