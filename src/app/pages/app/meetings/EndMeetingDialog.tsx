import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Meeting } from "@/types/entities/meeting";

interface EndMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function EndMeetingDialog({
  open,
  onOpenChange,
  meeting,
  onConfirm,
  isLoading,
}: Readonly<EndMeetingDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kết thúc cuộc họp</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn kết thúc cuộc họp này? Hành động này sẽ đóng phòng họp đối với tất cả mọi người đang tham gia.
          </DialogDescription>
        </DialogHeader>

        {meeting && (
          <div className="rounded-md border p-4 bg-neutral-50/50 dark:bg-neutral-900/10 space-y-1.5 text-sm">
            <p>
              <span className="font-semibold text-neutral-500">Tên cuộc họp:</span>{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {meeting.title}
              </span>
            </p>
            <p>
              <span className="font-semibold text-neutral-500">Mã tham gia:</span>{" "}
              <span className="font-mono font-semibold tracking-wider text-neutral-900 dark:text-neutral-100">
                {meeting.joinCode}
              </span>
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Đang kết thúc..." : "Kết thúc cuộc họp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
