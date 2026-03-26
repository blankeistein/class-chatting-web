# API Documentation

Dokumentasi API proyek ini dibuat menggunakan package `dedoc/scramble`.

Lokasi dokumentasi:
- UI interaktif: `/docs/api`
- OpenAPI JSON runtime: `/docs/api.json`
- OpenAPI JSON untuk repo dan AI tooling: `openapi.json`

Cakupan dokumentasi:
- Public API: endpoint di bawah prefix `/api`
- Private API: endpoint di bawah prefix `/private-api/{api_key}`
- Firebase webhook: endpoint di bawah prefix `/api/firebase`

Aturan autentikasi utama:
- Public book activation menggunakan field body `api_key`
- Private API menggunakan path parameter `{api_key}`
- Firebase webhook menggunakan header `X-Firebase-Secret`

Tujuan file `openapi.json`:
- Dibaca AI agent atau LLM
- Dipakai generator SDK atau client
- Dipakai automation tooling untuk validasi kontrak API

Regenerasi dokumentasi:

```bash
php artisan scramble:export --path openapi.json
```
