/**
 * Mã PIN không được lưu ở đây dưới dạng số thật — nếu lưu thẳng, bất kỳ
 * ai mở DevTools / xem source bundle cũng đọc được ngay. Thay vào đó ta
 * lưu bản băm SHA-256 (hex) của mã PIN, và khi người xem nhập mã,
 * PinGate sẽ băm số họ nhập rồi so sánh hai chuỗi hash với nhau.
 *
 * ⚠️ Lưu ý thành thật: đây chỉ là một lớp khóa "nhẹ", cho mục đích
 * riêng tư/cá nhân (chặn người vô tình lướt qua link), KHÔNG phải bảo
 * mật thật sự — mã PIN 6 số chỉ có 1.000.000 khả năng, và mọi thứ chạy
 * ở phía trình duyệt (client-side) nên vẫn có thể bị dò bằng máy tính.
 * Đừng dùng cách này để bảo vệ dữ liệu thật sự nhạy cảm.
 *
 * ─────────────────────────────────────────────────────────────
 * CÁCH TẠO HASH CHO MÃ PIN CỦA BẠN
 * ─────────────────────────────────────────────────────────────
 * Mở DevTools Console của trình duyệt (F12 → tab Console) ở bất kỳ
 * trang nào, dán đoạn sau, thay "123456" bằng mã PIN bạn muốn, rồi
 * Enter:
 *
 *   crypto.subtle.digest("SHA-256", new TextEncoder().encode("123456"))
 *     .then(buf => console.log(
 *       [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("")
 *     ));
 *
 * Copy chuỗi hex in ra và dán vào PIN_HASH bên dưới.
 *
 * Mã PIN mặc định hiện tại bên dưới là "000000" — hãy đổi ngay.
 */
export const PIN_HASH =
  "f65f33d1e35fba10db8dcada091ba6b1cdba86ea908c30d8b310f74158a15741";
