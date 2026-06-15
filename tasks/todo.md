# visitor-app — Phase 6

현재 Phase: **Phase 6 (목표 정합)**  
시작일: 2026-06-08

---

## Phase 6 체크리스트

### 출장 관리 (핵심 공백)
- [x] migration 013 — `projects`, `business_trips`
- [x] `/trips` 목록·등록·상세 + API
- [x] 사이드바 메뉴 · RBAC (`trips.*`)

### 출입 · 차량 · 분류
- [x] `access_records` — `record_category`, `vehicle_number`, `project_id`
- [x] 출입 폼/목록 — 방문자·차량·납품 유형

### 미팅 · 방문객 분류
- [x] `meetings.meeting_type` — 사내/외부방문/외부출장/화상
- [x] `project_id` — 방문객·미팅·출입·출장 연결

### 통합 검색 · 자산화
- [x] 검색어 1(회사/프로젝트) + 검색어 2(키워드)
- [x] `/api/search/timeline` — 방문·미팅·출장·출입 시간순 스토리
- [x] `/api/export/timeline` — CSV보내기 (Manager/Admin)

### 검증
- [x] `pnpm build` 성공

### 배포 전 확인
- [ ] Neon에 migration 013 적용
- [ ] 프로젝트 데이터 시드 또는 Admin이 프로젝트 생성

---

## Review Section

**Phase 6 완료 (2026-06-08)**

대표님 목표 정합: 출장 관리 추가, 출입 차량·납품 유형, 미팅 사내/외부 구분, 프로젝트 연동, 통합 타임라인 검색·CSV보내기.
