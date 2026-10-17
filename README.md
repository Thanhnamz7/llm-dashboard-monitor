# LLMOps Dashboard Monitor

<div align="center">

![CI Pipeline](https://github.com/Thanhnamz7/llm-dashboard-monitor/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=nodedotjs)
![Vitest](https://img.shields.io/badge/Tests-15%2F15%20Passed-brightgreen?logo=vitest)

**Dashboard Giám sát Ứng dụng LLM: Chi phí Token, Độ trễ, Tỷ lệ Lỗi (LLMOps)**  
*"Biết LLM đang tốn bao nhiêu, chậm ở đâu và lỗi vì sao."*

Học phần: **Các Vấn Đề Hiện Đại Của Công Nghệ Phần Mềm (DHIT20)**  
Đơn vị thực hiện: **Nhóm 69** • Phiên bản: **v2.0 (Chuẩn NCKH)**

</div>

---

## 1. Giới thiệu Dự án

Khi tích hợp các mô hình ngôn ngữ lớn (LLM) vào phần mềm, các đội ngũ kỹ thuật thường gặp khó khăn trong việc theo dõi đồng thời:
* Lượng token thực tế tiêu thụ và chi phí ước tính phát sinh.
* Thời gian phản hồi và hiện tượng trễ cao ở phân vị đuôi (Tail Latency - P95, P99).
* Tỷ lệ lỗi và các nguyên nhân thất bại (Rate Limit, Timeout, Context Length Exceeded).

**LLMOps Dashboard Monitor** là giải pháp quan sát tập trung (LLM Observability / Telemetry System) độc lập với nhà cung cấp (provider-agnostic), tiếp nhận telemetry từ **OpenCode** và các ứng dụng AI, chuẩn hóa dữ liệu, lưu trữ bền vững và hiển thị các chỉ số KPI theo thời gian thực.

---

## 2. Thông tin Nhóm Thực hiện (Nhóm 69)

| STT | Họ và Tên | Mã Sinh Viên | Vai trò Dự án | Trách nhiệm Chính |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Nguyễn Thành Nam** | 2474820253 | **Trưởng nhóm (PM / Tech Lead)** | Quản lý tiến độ, kiến trúc hệ thống, GitHub CI/CD, tích hợp mã nguồn. |
| 2 | **Phạm Phúc Đức Anh** | 2474820013 | **Developer A (Backend / Data)** | Xây dựng Collector, chuẩn hóa Telemetry, thiết kế CSDL, tính toán Token & Cost. |
| 3 | **Nguyễn Duy Kiên** | 2474820079 | **Developer B (Frontend / API)** | Xây dựng REST API, giao diện Web Dashboard, Recharts, bộ lọc, song ngữ Anh - Việt. |
| 4 | **Phạm Đức Thành** | 2474820136 | **Tester A (Backend QA)** | Xây dựng test plan, unit test Collector, kiểm thử tính chính xác Cost/Latency/Error. |
| 5 | **Nguyễn Trường Giang** | 2474820051 | **Tester B (Frontend QA)** | Kiểm thử giao diện, E2E flow, bộ lọc, kịch bản lỗi Demo Day (Simulator). |

---

## 3. Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo kiến trúc phân tầng rõ ràng giữa thu thập, xử lý, lưu trữ và trình diễn:

```text
+-------------------------------------------------------+
|                 Nguồn phát sinh LLM                   |
|       (OpenCode CLI / AI Agent / Ứng dụng ngoài)      |
+---------------------------+---------------------------+
                            | (HTTP Telemetry / Local SQLite Watcher)
                            v
+-------------------------------------------------------+
|             OpenCode Collector & Adapter              |
|              (@llmops/opencode-collector)             |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|             Telemetry Normalization & Zod             |
|                  (@llmops/telemetry)                  |
|    - Gán/kiểm tra request_id duy nhất (Idempotency)   |
|    - Chuẩn hóa timestamp, model, tokens, latency, cost|
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|             Tầng Lưu trữ Kép (@llmops/db)             |
|       - PostgreSQL (Drizzle ORM) khi có Docker        |
|       - Persistent Local Store tự động khi dev        |
+---------------------------+---------------------------+
                            |
                            v
+-------------------------------------------------------+
|        Metrics Engine & REST API (@llmops/api)        |
|       - Tính toán 6 MVP KPI: Total Reqs, Tokens,      |
|         Cost, Avg Latency, P95 Latency, Error Rate    |
|       - Gom cụm chuỗi thời gian (Time-Series)         |
+---------------------------+---------------------------+
                            | (REST API :4000)
                            v
+-------------------------------------------------------+
|           Web Dashboard UI (@llmops/web :3000)        |
|  - 6 KPI Cards       - Recharts Time-Series           |
|  - Bộ lọc đa chiều   - Request Explorer & Detail Modal|
|  - Live Simulator    - Song ngữ Anh / Việt            |
+-------------------------------------------------------+
```

---

## 4. Các Tính năng Nổi bật

### 4.1. Bộ chỉ số 6 KPI cốt lõi (MVP)
* **Total Requests:** Tổng số yêu cầu, phân tách chi tiết thành công và thất bại.
* **Total Tokens:** Tổng lượng token tiêu thụ kèm phân rã rõ ràng giữa `Input Tokens` và `Output Tokens`.
* **Estimated Cost (USD):** Chi phí ước tính tính toán tự động dựa trên bảng giá `model_pricing` của từng model.
* **Average Latency:** Thời gian phản hồi trung bình (mili-giây).
* **P95 Latency:** Độ trễ phân vị 95% (kèm hiển thị P50, P99) giúp nhận diện hiện tượng nghẽn mạng.
* **Error Rate (%):** Tỷ lệ phần trăm request lỗi thời gian thực.

### 4.2. Trực quan hóa Biểu đồ (Charts)
* Biểu đồ miền xu hướng **Requests & Errors** theo thời gian.
* Biểu đồ diện tích xếp chồng theo dõi **Lượng Token tiêu thụ (In vs Out)**.
* Biểu đồ đường biến động **Chi phí ước tính ($)**.
* Biểu đồ đối sánh giữa **Độ trễ trung bình** và **P95 Latency**.
* Bảng phân tích chi phí và số lượt gọi theo **Từng Model**.
* Thống kê phân loại **Các dạng lỗi phổ biến** (Timeout, Rate limit, Context length...).

### 4.3. Request Explorer & Tra cứu Chi tiết
* Bảng lịch sử toàn bộ các request hỗ trợ tìm kiếm theo ID/Model/Lỗi, phân trang linh hoạt và sắp xếp đa tiêu chí.
* Cửa sổ **Request Detail Modal** cho phép xem toàn bộ thông tin chi tiết, công thức tính toán chi phí và sao chép dữ liệu thô dạng JSON.

### 4.4. Tự động Đồng bộ trực tiếp từ OpenCode (Live Collector)
* Tự động phát hiện cơ sở dữ liệu làm việc của OpenCode trên máy (`opencode.db`).
* Khi người dùng gõ lệnh hoặc tương tác trong OpenCode, Collector tự động bắt các bản ghi mới và hiển thị trực tiếp lên Dashboard mà không cần cấu hình phức tạp.

### 4.5. Đa ngôn ngữ (Bilingual UI)
* Chuyển đổi linh hoạt giữa **Tiếng Việt 🇻🇳** và **English 🇬🇧** chỉ với 1 click ngay trên thanh điều hướng.

---

## 5. Công nghệ Sử dụng (Tech Stack)

* **Monorepo:** npm workspaces kết hợp TypeScript 5.3.
* **Backend:** Node.js, Express, Zod (Validation), Drizzle ORM, node:sqlite / pg.
* **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide Icons.
* **Testing:** Vitest (15/15 test cases bao phủ TC01 - TC19).
* **CI/CD:** GitHub Actions (tự động kiểm tra chất lượng trên nhánh `main` và `develop`).

---

## 6. Hướng dẫn Cài đặt & Khởi chạy (Quick Start)

### Yêu cầu hệ thống:
* **Node.js:** Phiên bản 18, 20 hoặc 22/24 trở lên.
* **Hệ điều hành:** Windows, macOS hoặc Linux.

### Bước 1: Cài đặt phụ thuộc
```bash
npm install
```

### Bước 2: Khởi chạy toàn bộ hệ thống
```bash
npm run dev
```
Lệnh trên sẽ đồng thời khởi động:
* **Backend API:** hoạt động tại `http://localhost:4000`
* **Web Dashboard:** hoạt động tại `http://localhost:3000`

Mở trình duyệt truy cập `http://localhost:3000` để bắt đầu sử dụng.

### Bước 3: Nạp dữ liệu mẫu (Tùy chọn)
Nếu muốn nạp ngay 200 requests mẫu sinh động để kiểm tra biểu đồ:
```bash
npm run seed
```
*(Hoặc bấm nút **"Dữ liệu mẫu"** trực tiếp trên thanh Header của Dashboard).*

---

## 7. Chạy Kiểm thử (Testing)

Dự án áp dụng Test Plan chuẩn theo hồ sơ NCKH (TC01 - TC19). Để chạy toàn bộ bộ kiểm thử tự động:

```bash
npm test
```

Kết quả:
```text
 ✓ tests/unit/metrics.test.ts (4 tests)
 ✓ tests/unit/telemetry.test.ts (7 tests)
 ✓ tests/integration/repository.test.ts (4 tests)

 Test Files  3 passed (3)
      Tests  15 passed (15)
```

---

## 8. Hướng dẫn Tích hợp Telemetry API

Bất kỳ ứng dụng nào (script Python, bot chat, backend Node.js) đều có thể gửi số liệu về Dashboard thông qua endpoint:
👉 `POST http://localhost:4000/api/telemetry`

### Mẫu tích hợp bằng Python:
```python
import requests

payload = {
    "provider": "openai",
    "model": "gpt-4o",
    "input_tokens": 1250,
    "output_tokens": 320,
    "latency_ms": 780,
    "status": "success"  # hoặc "error" nếu gặp sự cố
}

requests.post("http://localhost:4000/api/telemetry", json=payload)
```

### Mẫu tích hợp bằng Node.js / JavaScript:
```javascript
await fetch("http://localhost:4000/api/telemetry", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    provider: "opencode",
    model: "opencode-code-v1",
    input_tokens: 800,
    output_tokens: 250,
    latency_ms: 620,
    status: "success"
  })
});
```

---

## 9. Kịch bản Thuyết minh Bảo vệ (Demo Day - 16 Phút)

Tuân thủ nghiêm ngặt theo **Mục 10 của Hồ sơ dự án**:
1. **Phút 01:** Giới thiệu bài toán phân tích chi phí và độ trễ LLM.
2. **Phút 02-03:** Trình chiếu kiến trúc hệ thống và luồng dữ liệu 5 bước.
3. **Phút 04-06:** Demo OpenCode chạy lệnh thực tế $\rightarrow$ Collector tự động ghi nhận vào CSDL.
4. **Phút 07-09:** Demo Dashboard hiển thị đầy đủ 6 chỉ số KPI và các biểu đồ xu hướng.
5. **Phút 10-11:** Thao tác bộ lọc thời gian/model và mở màn hình Request Detail.
6. **Phút 12-13:** Báo cáo kết quả kiểm thử (15/15 Passed).
7. **Phút 14-15:** Demo xử lý lỗi: Bấm nút **"Giả lập Request"** $\rightarrow$ chọn **"Bơm lỗi Timeout / Rate Limit"** $\rightarrow$ quan sát tỷ lệ lỗi (Error Rate) và biểu đồ cập nhật trực tiếp.
8. **Phút 16:** Trả lời câu hỏi phản biện của hội đồng giảng viên.

---

## 10. Giấy phép & Quy tắc Quản lý Nhánh (Git Flow)

* Nhánh `main`: Nhánh sản phẩm ổn định, được bảo vệ nghiêm ngặt (Protected branch).
* Nhánh `develop`: Nhánh tích hợp tính năng chung.
* Quy ước Commit: Tuân thủ nghiêm ngặt **Conventional Commits** (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
