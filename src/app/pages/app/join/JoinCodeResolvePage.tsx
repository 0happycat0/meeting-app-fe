import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { resolveJoinCode } from "@/features/meetings/api/meetings";
import { paths } from "@/config/paths";

export default function JoinCodeResolvePage() {
  const { joinCode } = useParams<{ joinCode: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!joinCode) {
      setError("Mã tham gia không hợp lệ.");
      setIsLoading(false);
      return;
    }

    const resolveCode = async () => {
      try {
        const response = await resolveJoinCode(joinCode);
        const meeting = response.result;

        toast.success(`Tìm thấy cuộc họp: ${meeting.title}`);
        
        navigate(paths.app.preview.path(joinCode));
      } catch (err: any) {
        setError(err.message || "Mã tham gia không hợp lệ hoặc cuộc họp đã kết thúc.");
        toast.error("Không thể giải quyết mã tham gia.");
      } finally {
        setIsLoading(false);
      }
    };

    resolveCode();
  }, [joinCode, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Đang xác thực mã cuộc họp...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-md mx-auto text-center px-4">
      <div className="p-4 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500">
        <AlertCircle className="size-10" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Lỗi tham gia cuộc họp</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
      </div>

      <Button onClick={() => navigate(paths.app.meetings.path)} className="w-full sm:w-auto">
        <ChevronLeft className="size-4 mr-2" /> Quay lại trang chủ
      </Button>
    </div>
  );
}
