/**
 * Số pseudo-ngẫu nhiên **xác định**: cùng input luôn ra cùng output, ở cả
 * server lẫn client.
 *
 * Các pattern sinh hoa/họa tiết phải dựng ra một cây DOM giống hệt nhau
 * ở hai bên, nếu không React sẽ báo lệch hydrate. `Math.random()` sẽ phá
 * điều đó, nên dùng hàm này thay vào.
 */
export function seeded(index: number, salt = 0): number {
  const x = Math.sin(index * 127.1 + salt * 311.7 + 74.7) * 43758.5453123;
  return x - Math.floor(x);
}
