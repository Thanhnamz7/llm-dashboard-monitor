# Hướng dẫn đóng góp (CONTRIBUTING) & Quy tắc nhánh Git

Dự án áp dụng mô hình **GitHub Flow**. Mọi tính năng, sửa lỗi đều phải đi qua nhánh riêng và Pull Request vào nhánh `develop` hoặc `main`.

---

## 1. Quy ước đặt tên nhánh (Branch Naming)
Cú pháp: `<loai>/<mo-ta-ngan>` (viết thường, không dấu, nối bằng dấu `-`)

- `feature/<ten-chuc-nang>`: Thêm tính năng mới (Ví dụ: `feature/collector-opencode`, `feature/metrics-kpi`)
- `bugfix/<ten-loi>`: Sửa lỗi (Ví dụ: `bugfix/fix-token-calc`, `bugfix/fix-p95-latency`)
- `docs/<ten-tai-lieu>`: Cập nhật tài liệu (Ví dụ: `docs/update-architecture`)
- `chore/<ten-cong-viec>`: Cấu hình, CI, setup thư viện (Ví dụ: `chore/setup-ci`)
- `refactor/<ten-module>`: Tái cấu trúc code (Ví dụ: `refactor/collector-schema`)

---

## 2. Quy ước Commit Message (Conventional Commits)
Cú pháp: `<type>(<scope>): <mô tả>`

Các loại `type`:
- `feat`: Tính năng mới
- `fix`: Sửa lỗi
- `docs`: Sửa hoặc thêm tài liệu
- `test`: Viết unit test / e2e test
- `refactor`: Tái cấu trúc code
- `chore`: Cấu hình, dependencies, CI

Ví dụ:
- `feat(collector): add opencode telemetry parser`
- `fix(metrics): correct error rate formula`
- `test(metrics): add test case for p95 calculation`

---

## 3. Quy trình làm việc hàng ngày (Daily Workflow)

```bash
# 1. Lấy code mới nhất từ nhánh develop
git switch develop
git pull origin develop

# 2. Tạo nhánh làm việc mới
git switch -c feature/ten-chuc-nang

# 3. Code, kiểm thử và commit
git add .
git commit -m "feat(module): mo ta thay doi"

# 4. Push nhánh lên GitHub
git push -u origin feature/ten-chuc-nang
```

---

## 4. Quy trình Pull Request & Review
1. Mở Pull Request: `base: develop` $\leftarrow$ `compare: feature/...`
2. Điền đầy đủ mô tả PR theo template.
3. Đảm bảo CI xanh trước khi yêu cầu review.
4. Tối thiểu **1 approving review** từ thành viên trong nhóm trước khi merge.
5. Chọn hình thức **Squash and merge**.
6. Xóa nhánh sau khi merge thành công.
