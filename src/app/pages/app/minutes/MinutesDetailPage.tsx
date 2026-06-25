import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Eye,
  AlertCircle,
  EyeOff,
  Check,
  FileCheck,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useAuth } from "@/hooks/use-auth";
import {
  useMeetingDetail,
  useGenerateMeetingMinutes,
  useMeetingMinutes,
  usePublishMeetingMinutes,
} from "@/features/meetings/api/use-meetings";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { paths } from "@/config/paths";

export default function MinutesDetailPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.sub;

  const [pollInterval, setPollInterval] = useState<number | false>(false);

  // Fetch meeting details to check host status & meeting status
  const {
    data: meetingResponse,
    isLoading: isMeetingLoading,
    error: meetingError,
  } = useMeetingDetail(meetingId ?? "");

  const meeting = meetingResponse?.result;
  const isHost = meeting?.hostId === currentUserId;

  // Fetch minutes record (with conditional polling)
  const {
    data: minutesResponse,
    isLoading: isMinutesLoading,
    error: minutesError,
    refetch: refetchMinutes,
    isFetching: isFetchingMinutes,
  } = useMeetingMinutes(meetingId ?? "", {
    refetchInterval: pollInterval,
  });

  const minutes = minutesResponse?.result;

  // Mutation Hooks
  const generateMutation = useGenerateMeetingMinutes(meetingId ?? "");
  const publishMutation = usePublishMeetingMinutes(meetingId ?? "");

  // Polling controller effect
  useEffect(() => {
    if (minutes?.status === "GENERATING") {
      setPollInterval(2500); // Poll every 2.5 seconds
    } else {
      setPollInterval(false); // Stop polling
    }
  }, [minutes?.status]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      setPollInterval(false);
    };
  }, []);

  // Actions handlers
  const handleGenerate = async () => {
    try {
      if (minutes) {
        toast.info("Đang tiến hành tạo lại biên bản bằng AI...");
      }
      await generateMutation.mutateAsync();
    } catch (err: any) {
      toast.error(err.message || "Tạo biên bản thất bại.");
    }
  };

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync();
      toast.success("Đã công bố biên bản cuộc họp thành công!");
    } catch (err: any) {
      toast.error(err.message || "Công bố biên bản thất bại.");
    }
  };

  const handleExportMarkdown = () => {
    if (!meeting || !minutes || !minutes.contentMarkdown) return;
    try {
      const blob = new Blob([minutes.contentMarkdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const sanitizedTitle = meeting.title.replace(/[^a-zA-Z0-9\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂĐÊÔƠƯưăâđêôơư\-_]/g, "").trim();
      link.download = `Bien_ban_Cuoc_hop_${sanitizedTitle || "Minutes"}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Không thể xuất file biên bản.");
    }
  };

  // Loading and error states handling
  if (isMeetingLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin cuộc họp...</p>
      </div>
    );
  }

  if (meetingError || !meeting) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi xảy ra</AlertTitle>
          <AlertDescription>
            {meetingError?.message || "Không thể tìm thấy thông tin cuộc họp."}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate(paths.app.minutes.path)} className="mt-4">
          <ChevronLeft className="size-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Helper check for custom error codes
  const isNotFoundError = minutesError?.code === 4501;
  const isNoTranscriptError = minutesError?.code === 4502;

  const renderContent = () => {
    if (isMinutesLoading && !minutes) {
      return (
        <Card className="border border-neutral-100 bg-white">
          <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
            <Spinner className="size-8" />
            <p className="text-sm text-neutral-500">Đang kiểm tra thông tin biên bản...</p>
          </CardContent>
        </Card>
      );
    }

    if (minutesError && !minutes) {
      if (isNotFoundError) {
        return renderEmptyState();
      }
      if (isNoTranscriptError) {
        return (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Không có nội dung</AlertTitle>
            <AlertDescription>
              Cuộc họp không có nội dung transcript để tạo biên bản.
            </AlertDescription>
          </Alert>
        );
      }
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi tải biên bản</AlertTitle>
          <AlertDescription>
            {minutesError.message || "Đã xảy ra lỗi khi tải dữ liệu biên bản."}
          </AlertDescription>
        </Alert>
      );
    }

    if (!minutes) {
      return renderEmptyState();
    }
    if (minutes.status === "GENERATING") {
      return (
        <Card className="border border-neutral-100 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
            <div className="p-4 rounded-full bg-primary/5 text-primary animate-pulse">
              <Sparkles className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">AI đang tạo biên bản cuộc họp</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Hệ thống đang phân tích bản dịch thoại và tổng hợp nội dung. Quá trình này có thể mất ít phút.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-2">
              <Spinner className="size-3 text-neutral-400" />
              <span>Đang tạo biên bản...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (minutes.status === "FAILED") {
      return (
        <Card className="border border-red-100 bg-red-50/20 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
            <AlertCircle className="size-12 text-red-500" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-red-900">Tạo biên bản thất bại</h3>
              <p className="text-sm text-red-700/80 max-w-md mx-auto">
                Lỗi: {minutes.failureReason || "Mô hình AI gặp sự cố trong quá trình xử lý văn bản."}
              </p>
            </div>
            {isHost && (
              <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="mt-2 cursor-pointer">
                <Sparkles className="size-4 mr-2" /> Thử tạo lại
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    if (!minutes.published && !isHost) {
      return renderEmptyState();
    }
    return (
      <div className="space-y-6">
        {/* Unpublished banner for Host/Admin */}
        {!minutes.published && isHost && (
          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
            <EyeOff className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="font-semibold">Chế độ xem trước (Chưa công bố)</AlertTitle>
            <AlertDescription className="block leading-relaxed">
              Biên bản này đang ở trạng thái nháp. Chỉ có bạn (chủ trì) mới xem được. Hãy nhấn nút <strong className="font-semibold">"Công bố"</strong> bên trên để chia sẻ cho tất cả thành viên khác trong cuộc họp.
            </AlertDescription>
          </Alert>
        )}

        {/* Markdown Render Area */}
        <Card>
          <CardContent className="px-10 py-4">
            <MarkdownRenderer content={minutes.contentMarkdown} />
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <Card className="border border-neutral-100 bg-white shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
          <div className="p-4 rounded-full bg-neutral-50 text-neutral-400">
            <FileCheck className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Chưa có biên bản cuộc họp</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {isHost
                ? "Cuộc họp đã kết thúc. Nhấn nút dưới đây để kích hoạt AI tạo tóm tắt biên bản cuộc họp tự động."
                : "Người chủ trì chưa tạo biên bản cuộc họp này."}
            </p>
          </div>
          {isHost && (
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="mt-2 cursor-pointer"
            >
              <Sparkles className="size-4 mr-2" />
              Tạo biên bản bằng AI
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(paths.app.minutes.path)}
        >
          <ChevronLeft className="size-4 mr-1" />
          Danh sách biên bản
        </Button>

        {/* Action Controls */}
        {minutes && minutes.status === "COMPLETED" && (
          <div className="flex items-center gap-2">
            {(minutes.published || isHost) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMarkdown}
                className="cursor-pointer"
              >
                <Download className="size-4 mr-1.5" />
                Xuất file (.md)
              </Button>
            )}
            {isHost && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="cursor-pointer"
              >
                <RefreshCw className="size-4 mr-1.5" />
                Tạo lại bằng AI
              </Button>
            )}
            {isHost && !minutes.published && (
              <Button
                variant="default"
                size="sm"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="cursor-pointer"
              >
                <Check className="size-4 mr-1.5" />
                Công bố
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Meeting Summary Title Header */}
      <div className="space-y-3 pb-4 border-b border-neutral-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {meeting.title}
          </h1>
          {minutes && (
            <Badge
              variant="secondary"
              className={
                minutes.status === "COMPLETED"
                  ? minutes.published
                    ? "bg-green-100 text-green-800 hover:bg-green-150 border-green-200"
                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-150 border-yellow-200"
                  : minutes.status === "GENERATING"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-150 border-blue-200"
                    : "bg-red-100 text-red-800 hover:bg-red-150 border-red-200"
              }
            >
              {minutes.status === "COMPLETED"
                ? minutes.published
                  ? "Đã công bố"
                  : "Bản nháp"
                : minutes.status === "GENERATING"
                  ? "Đang xử lý..."
                  : "Thất bại"}
            </Badge>
          )}
        </div>
        <p className="text-sm text-neutral-500">
          Chủ trì:{" "}
          <strong className="text-neutral-800">
            {[meeting.hostLastName, meeting.hostFirstName].filter(Boolean).join(" ").trim() || "Chủ phòng"}
          </strong>{" "}
          • Ngày tạo: {format(new Date(meeting.createdAt), "dd/MM/yyyy")}
        </p>
        {meeting.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-md border border-neutral-100 dark:border-neutral-800">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Mô tả:</span>{" "}
            {meeting.description}
          </p>
        )}
      </div>

      {/* Main Content Area */}
      <div>{renderContent()}</div>
    </div>
  );
}
