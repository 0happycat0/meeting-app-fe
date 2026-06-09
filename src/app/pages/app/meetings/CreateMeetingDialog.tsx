import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerInput } from "@/components/DatePickerInput";

import { useCreateMeeting } from "@/features/meetings/api/use-meetings";
import type { MeetingType } from "@/types/entities/meeting";
import { paths } from "@/config/paths";

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: MeetingType;
}

export default function CreateMeetingDialog({
  open,
  onOpenChange,
  initialType = "INSTANT",
}: Readonly<CreateMeetingDialogProps>) {
  const navigate = useNavigate();
  const createMeetingMutation = useCreateMeeting();

  // Tab State
  const [meetingType, setMeetingType] = useState<MeetingType>(initialType);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("10:00");

  // Sync initialType when dialog opens
  useEffect(() => {
    if (open) {
      setMeetingType(initialType);
    }
  }, [open, initialType]);

  // Reset form helper
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime("09:00");
    setEndTime("10:00");
  };

  const combineDateAndTime = (date: Date | undefined, timeString: string) => {
    if (!date) return null;
    const [hours, minutes] = timeString.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(hours || 0, minutes || 0, 0, 0);
    return combined;
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên cuộc họp");
      return;
    }

    let scheduledStartAt: string | null = null;
    let scheduledEndAt: string | null = null;

    if (meetingType === "SCHEDULED") {
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
      const result = await createMeetingMutation.mutateAsync({
        title,
        description: description.trim() || null,
        meetingType: meetingType,
        scheduledStartAt,
        scheduledEndAt,
      });

      toast.success(
        meetingType === "INSTANT"
          ? "Tạo cuộc họp tức thì thành công!"
          : "Đặt lịch cuộc họp thành công!"
      );

      resetForm();
      onOpenChange(false);

      // Điều hướng về trang chi tiết cuộc họp vừa tạo
      navigate(paths.app.meetingDetails.path(result.id));
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo cuộc họp.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Tạo cuộc họp</DialogTitle>
          <DialogDescription>
            Tạo cuộc họp nhanh hoặc lên lịch trước với các thành viên.
          </DialogDescription>
        </DialogHeader>

        {/* Type Tabs */}
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Loại</Label>
            <Tabs
              value={meetingType}
              onValueChange={(value) => setMeetingType(value as MeetingType)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="INSTANT">Tức thì</TabsTrigger>
                <TabsTrigger value="SCHEDULED">Đặt lịch</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <form
            onSubmit={handleCreateMeeting}
            className="space-y-4"
          >
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
              />
            </div>

            {/* Scheduled Date Pickers */}
            {meetingType === "SCHEDULED" && (
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
              <Button
                type="submit"
                disabled={createMeetingMutation.isPending}
              >
                {createMeetingMutation.isPending ? "Đang tạo..." : "Tạo cuộc họp"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
