// Cookie dang nhap chi gui qua HTTPS khi COOKIE_SECURE=true.
// Mac dinh: production -> true. Chay production qua HTTP (vd http://may-chu:3000) thi dat COOKIE_SECURE=false trong .env,
// neu khong trinh duyet se bo cookie va khong dang nhap duoc.
export const COOKIE_SECURE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : process.env.NODE_ENV === "production";
