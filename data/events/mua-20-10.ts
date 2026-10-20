import type { EventBody } from "./index";

/**
 * Sự kiện 20/10.
 *
 * Lời thư ở đây là bản nháp — sửa thoải mái, thêm bớt dòng cũng được.
 * Mỗi dòng hiện lên màn hình một lượt vài giây, nên giữ mỗi dòng ngắn
 * gọn (khoảng 30-70 ký tự) để nhịp đọc không bị kéo dài.
 *
 * Chưa có file ghi âm cho sự kiện này. Khi có, thêm file vào
 * `public/audio/` rồi điền `audio` bên dưới.
 */
export const body: EventBody = {
  lines: [
    "Hôm nay là ngày của những người con gái.",
    "Và trong tất cả những người con gái, anh luôn nghĩ đến em.",
    "Cảm ơn em vì đã mạnh mẽ, dịu dàng, và kiên nhẫn với anh mỗi ngày.",
    "Hôm nay anh muốn nói rõ một điều: em xứng đáng được thương yêu vô điều kiện.",
    "Chúc em một ngày thật dịu dàng, và luôn được yêu thương nhiều như em xứng đáng.",
    "Anh yêu em.",
  ],
};
