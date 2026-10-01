#!/usr/bin/env bash
# =======================================================
# CAP NHAT WEB FBSHOP TREN HOSTING (chay trong Terminal cua hosting)
#   bash ~/fbshop/scripts/deploy-hosting.sh          # lay code moi nhat nhanh minh
#   bash ~/fbshop/scripts/deploy-hosting.sh main     # hoac nhanh khac
# Lay code tu GitHub -> cai thu vien (neu doi) -> build -> khoi dong lai bang pm2.
# File .env tren may chu khong nam trong Git nen duoc giu nguyen.
# =======================================================
set -euo pipefail

BRANCH="${1:-minh}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/node/bin:$PATH"
cd "$APP_DIR"

echo "==> Lay code moi nhat tu nhanh $BRANCH"
LOCK_BEFORE="$(md5sum package-lock.json 2>/dev/null | cut -d' ' -f1 || true)"
git fetch --quiet origin "$BRANCH"
git reset --hard --quiet "origin/$BRANCH"
echo "    Commit: $(git log -1 --format='%h %s')"

# Chi cai lai thu vien khi danh sach thu vien thay doi (tiet kiem thoi gian)
if [ "$LOCK_BEFORE" != "$(md5sum package-lock.json | cut -d' ' -f1)" ] || [ ! -d node_modules ]; then
  echo "==> Cai lai thu vien (package-lock.json thay doi)"
  npm ci
else
  echo "==> Thu vien khong doi, chi sinh lai Prisma Client"
  npx prisma generate
fi

# Hosting: glibc 2.28 khong chay duoc Turbopack -> build bang Webpack;
# gioi han so tien trinh/luong -> build bang 1 tien trinh, it luong,
# va tam dung web trong luc build (web dang chay chiem mat so luong cho phep)
export NEXT_BUILD_CPUS=1 RAYON_NUM_THREADS=1 UV_THREADPOOL_SIZE=2 NEXT_TELEMETRY_DISABLED=1
echo "==> Tam dung web de build (web tam ngung khoang 3 phut)"
pm2 stop fbshop >/dev/null || true
echo "==> Build ban production"
if ! npx next build --webpack; then
  echo "!!! Build loi -> chay lai web voi ban build truoc do (neu con)"
  pm2 start fbshop >/dev/null || true
  exit 1
fi

echo "==> Khoi dong lai web"
pm2 restart fbshop
pm2 save
sleep 5
curl -s -o /dev/null -w "==> Trang chu: %{http_code}\n" http://127.0.0.1:3999/
