/**
 * Số pseudo-ngẫu nhiên **xác định**: cùng input luôn ra cùng output.
 *
 * Các pattern sinh hoa/họa tiết phải dựng ra một cây DOM giống hệt nhau
 * ở cả server lẫn client, nếu không React sẽ báo lệch hydrate. `Math.random()`
 * sẽ phá điều đó, nên dùng hàm này thay vào.
 *
 * Vì sao lại làm tròn: `Math.sin` giữa Node và trình duyệt có thể lệch
 * ở chữ số thứ ~11 (`130.52419419429498` vs `130.52419419167563`). Lệch
 * nhỏ vậy là đủ để React coi là attribute khác nhau. Làm tròn còn 4 chữ
 * số thập phân ở đây khiến hai bên luôn ra đúng cùng một con số.
 */
export function seeded(index: number, salt = 0): number {
  const x = Math.sin(index * 127.1 + salt * 311.7 + 74.7) * 43758.5453123;
  return Math.round((x - Math.floor(x)) * 10000) / 10000;
}
