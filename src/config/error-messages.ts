export const ERROR_MESSAGES: Record<number, string> = {
  // Lỗi hệ thống & Chưa phân loại (9999, 10xx)
  9999: "Lỗi hệ thống chưa phân loại",
  1001: "Khóa thông điệp không hợp lệ",

  // Xác thực & Tài khoản (2xxx, 3xxx)
  2001: "Phiên đăng nhập hết hạn hoặc chưa xác thực",
  2002: "Bạn không có quyền thực hiện thao tác này",
  3001: "Người dùng đã tồn tại trong hệ thống",
  3002: "Người dùng không tồn tại trong hệ thống",
  3003: "Tên người dùng phải có ít nhất 3 ký tự",
  3004: "Mật khẩu phải có ít nhất 6 ký tự",
  3005: "Định dạng email không hợp lệ",
  3006: "Email đã tồn tại trong hệ thống",

  // Cuộc họp (40xx)
  4001: "Không tìm thấy cuộc họp tương ứng",
  4002: "Tiêu đề cuộc họp không hợp lệ",
  4003: "Mô tả cuộc họp không hợp lệ",
  4004: "Loại cuộc họp là thông tin bắt buộc",
  4005: "Thời gian lên lịch cuộc họp không hợp lệ",
  4006: "Bạn không có quyền tham gia hoặc truy cập cuộc họp này",
  4007: "Trạng thái hiện tại của cuộc họp không cho phép thực hiện thao tác này",
  4008: "Mã tham gia cuộc họp không hợp lệ",
  4009: "Không thể khởi tạo mã tham gia duy nhất cho cuộc họp",

  // Lời mời (41xx)
  4101: "Không tìm thấy lời mời cuộc họp",
  4102: "Lời mời cuộc họp đã được gửi cho người dùng này trước đó",
  4103: "Bạn không có quyền truy cập vào lời mời này",
  4104: "Trạng thái hiện tại của lời mời không hợp lệ cho hành động này",
  4105: "Người nhận lời mời không hợp lệ hoặc không tồn tại",

  // Người tham gia & Phòng chờ (42xx)
  4201: "Không tìm thấy người tham gia cuộc họp",
  4202: "Bạn không có quyền truy cập thông tin người tham gia này",
  4203: "Trạng thái của người tham gia không cho phép thực hiện hành động này",

  // LiveKit (43xx)
  4301: "Dịch vụ phòng họp trực tuyến (LiveKit) hiện không khả dụng",
  4302: "Tên hiển thị không hợp lệ",

  // Transcript (44xx)
  4401: "Đoạn phụ đề không hợp lệ",

  // Meeting Minutes (45xx)
  4501: "Không tìm thấy biên bản cuộc họp",
  4502: "Cuộc họp không có dữ liệu phụ đề để tạo biên bản",
  4503: "Tạo biên bản cuộc họp bằng AI thất bại",
  4504: "Trạng thái biên bản cuộc họp hiện tại không cho phép thực hiện hành động này",

  // Mã trạng thái HTTP chuẩn để làm fallback
  400: "Yêu cầu gửi đi không hợp lệ",
  401: "Chưa xác thực hoặc phiên làm việc đã hết hạn",
  403: "Bạn không có quyền truy cập tài nguyên này",
  404: "Không tìm thấy tài nguyên yêu cầu hoặc tính năng chưa được hỗ trợ",
  409: "Xung đột dữ liệu hoặc trạng thái không hợp lệ",
  500: "Đã xảy ra lỗi hệ thống từ máy chủ",
  502: "Cổng dịch vụ tạm thời không phản hồi",
  503: "Dịch vụ tạm thời bị gián đoạn hoặc đang bảo trì",
};

export const getErrorMessage = (code: number, fallbackMessage?: string): string => {
  return ERROR_MESSAGES[code] || fallbackMessage || "Đã xảy ra lỗi hệ thống";
};

