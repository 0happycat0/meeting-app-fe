import { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerInput } from "@/components/DatePickerInput";

import { useUpdateMeeting } from "@/features/meetings/api/use-meetings";
import type { Meeting } from "@/types/entities/meeting";

interface EditMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
}

export default function EditMeetingDialog({
  open,
  onOpenChange,
  meeting,
}: Readonly<EditMeetingDialogProps>) {
  const updateMeetingMutation = useUpdateMeeting();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("10:00");

  // Sync data when dialog opens
  useEffect(() => {
    if (open && meeting) {
      setTitle(meeting.title);
      setDescription(meeting.description || "");

      if (meeting.meetingType === "SCHEDULED" && meeting.scheduledStartAt) {
        const start = new Date(meeting.scheduledStartAt);
        setStartDate(start);
        setStartTime(
          `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
        );
      } else {
        setStartDate(undefined);
        setStartTime("09:00");
      }

      if (meeting.meetingType === "SCHEDULED" && meeting.scheduledEndAt) {
        const end = new Date(meeting.scheduledEndAt);
        setEndDate(end);
        setEndTime(
          `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
        );
      } else {
        setEndDate(undefined);
        setEndTime("10:00");
      }
    }
  }, [open, meeting]);

  const combineDateAndTime = (date: Date | undefined, timeString: string) => {
    if (!date) return null;
    const [hours, minutes] = timeString.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(hours || 0, minutes || 0, 0, 0);
    return combined;
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting) return;

    if (!title.trim()) {
      toast.error("Vui lòng nhập tên cuộc họp");
      return;
    }

    let scheduledStartAt: string | null = null;
    let scheduledEndAt: string | null = null;

    if (meeting.meetingType === "SCHEDULED") {
      if (!startDate || !endDate) {
        toast.error("Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc");
        return;
      }
      const startCombined = combineDateAndTime(startDate, startTime);
      const endCombined = combineDateAndTime(endDate, endTime);

      if (startCombined && endCombined) {
        if (endCombined <= startCombined) {
          toast.error("Thời gian kết thúc phải sau thời gian bắt đầu");
          return;
        }
        scheduledStartAt = startCombined.toISOString();
        scheduledEndAt = endCombined.toISOString();
      }
    }

    try {
      await updateMeetingMutation.mutateAsync({
        id: meeting.id,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          scheduledStartAt,
          scheduledEndAt,
        },
      });

      toast.success("Cập nhật cuộc họp thành công!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật cuộc họp.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chỉnh sửa cuộc họp</DialogTitle>
          <DialogDescription>
            Cập nhật tên, mô tả và thời gian của cuộc họp.
          </DialogDescription>
        </DialogHeader>

        {meeting && (
          <form onSubmit={handleUpdateMeeting} className="space-y-4 py-2">
            {/* Read-only Meeting Type */}
            <div className="space-y-1">
              <Label className="text-xs text-neutral-400">Loại cuộc họp</Label>
              <div className="text-sm font-semibold text-neutral-700">
                {meeting.meetingType === "INSTANT" ? "Tức thì" : "Đặt lịch"}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Tên cuộc họp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Họp nhóm dự án Alpha"
                maxLength={255}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về cuộc họp..."
                rows={3}
                maxLength={5000}
              />
            </div>

            {/* Scheduled Date Pickers (only for SCHEDULED) */}
            {meeting.meetingType === "SCHEDULED" && (
              <div className="space-y-4">
                {/* Start Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bắt đầu</Label>
                    <DatePickerInput
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Chọn ngày"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giờ bắt đầu</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* End Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kết thúc</Label>
                    <DatePickerInput
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="Chọn ngày"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giờ kết thúc</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={updateMeetingMutation.isPending}>
                {updateMeetingMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
