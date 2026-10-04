# LLMOps Dashboard Monitor

> Dashboard giám sát ứng dụng LLM: chi phí token, độ trễ, tỷ lệ lỗi (LLMOps)
> "Biết LLM đang tốn bao nhiêu, chậm ở đâu và lỗi vì sao."

## 1. Mục tiêu
- **Quan sát tập trung**: Telemetry request LLM từ OpenCode / các provider.
- **Minh bạch chi phí**: Token input/output và Estimated Cost.
- **Theo dõi hiệu năng & độ tin cậy**: Latency P50, P95, Avg, Error rate.
- **Request Explorer**: Tra cứu chi tiết từng request.

## 2. Nhánh làm việc
- `main`: Nhánh ổn định (Protected branch).
- `develop`: Nhánh làm việc chung tích hợp tính năng.
- `feature/*`: Các nhánh chức năng.
