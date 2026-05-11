# API Documentation — Ticketing System

> **Base URL:** `https://<your-domain>/api`
> **Auth:** Bearer Token (Sanctum) — dikirim via `Authorization: Bearer <token>`
> **Note:** Auth via login/register sudah tidak dipakai aktif. User masuk lewat SSO dari `pilargroup.id`, dan token Sanctum didapat otomatis setelah SSO callback berhasil.

---

## Daftar Isi

- [Authentication & SSO](#authentication--sso)
- [Profile](#profile)
- [User (Role: User)](#user-role-user)
- [Admin — Master Data](#admin--master-data)
- [Admin — Users & Department](#admin--users--department)
- [Admin — Tickets](#admin--tickets)
- [Admin — Feedback](#admin--feedback)
- [Admin — Projects](#admin--projects)
- [Admin — Reports](#admin--reports)
- [Response Format Umum](#response-format-umum)
- [Status Ticket](#status-ticket)
- [Status Project](#status-project)

---

## Authentication & SSO

> Autentikasi utama menggunakan SSO dari `pilargroup.id`. Endpoint login/register di bawah masih ada tapi sudah tidak dipakai di production flow.

---

### `GET /auth/sso-url`

Dapatkan URL redirect ke halaman login pilargroup SSO.

**Auth:** Tidak perlu

**Response `200`:**
```json
{
  "url": "https://pilargroup.id/login?sso_authorize=1&client_id=...&redirect_uri=...&state=...",
  "state": "random_string_40_chars",
  "redirect_uri": "https://ticket.pilargroup.id/api/auth/callback"
}
```

**Flow:**
1. FE panggil endpoint ini → dapat `url`
2. FE redirect user ke `url` tersebut
3. User login di pilargroup.id
4. Pilargroup redirect ke `/api/auth/callback?token=xxx&state=xxx`
5. BE verifikasi token ke pilargroup, buat Sanctum token
6. BE redirect ke FE: `/sso-success?token=<sanctum_token>&user=<encoded_json>`
7. FE simpan token dari URL param, simpan user info

---

### `GET /auth/callback`

**Internal** — diakses browser setelah redirect dari pilargroup. Bukan dipanggil FE secara langsung.

Setelah sukses, user akan di-redirect ke:
```
/sso-success?token=<sanctum_token>&user=<url_encoded_json>
```

User JSON yang di-encode:
```json
{
  "id": 1,
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@pilargroup.id",
  "role": "user",
  "job_position": "Staff IT",
  "phone": "08xx",
  "status": "active"
}
```

---

### `GET /auth/pg-token`

Ambil pg_token (token pilargroup) yang disimpan sementara di cache setelah SSO berhasil. Token ini one-time-use (langsung dihapus setelah diambil).

**Auth:** Bearer Token ✅

**Response `200`:**
```json
{
  "pg_token": "eyJ...",
  "pg_cv": "v3"
}
```

> Kalau sudah expired atau belum ada: `{ "pg_token": null, "pg_cv": null }`

---

### `POST /logout`

Revoke semua token aktif user.

**Auth:** Bearer Token ✅

**Response `200`:**
```json
{ "message": "Logout successful" }
```

---

### `POST /login` *(Legacy — tidak dipakai SSO)*

**Auth:** Tidak perlu

**Body:**
```json
{ "username": "johndoe", "password": "secret" }
```

**Response `200`:**
```json
{
  "message": "Login successful",
  "access_token": "sanctum_token_here",
  "token_type": "Bearer",
  "user": { ...UsersResource... }
}
```

---

### `POST /register` *(Legacy — tidak dipakai SSO)*

**Auth:** Tidak perlu

**Body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret",
  "department_id": 1
}
```

**Response `201`:** User dengan status `inactive` (perlu di-approve admin).

---

## Profile

### `GET /profile`

Ambil data user yang sedang login.

**Auth:** Bearer Token ✅

**Response `200`:**
```json
{
  "message": "User profile fetched successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@pilargroup.id",
    "role": "user",
    "status": "active",
    "job_position": "Staff IT",
    "phone": "08xx",
    "department_id": 2,
    "department": { "id": 2, "name": "IT" }
  }
}
```

---

## User (Role: User)

> Semua endpoint di bawah ini prefix-nya `/user` dan butuh auth.

---

### `GET /user/tickets`

Ambil daftar ticket milik user yang sedang login.

**Auth:** Bearer Token ✅

**Query Params:**

| Param | Type | Keterangan |
|---|---|---|
| `status` | string | Filter: `waiting`, `in_progress`, `resolved`, `feedback`, `void`, `all` |
| `start_date` | date `Y-m-d` | Filter tanggal mulai |
| `end_date` | date `Y-m-d` | Filter tanggal akhir |
| `per_page` | int | Default `20`, max `200` |
| `include_assets` | boolean | Sertakan relasi assets atau tidak |

**Response `200`:**
```json
{
  "message": "Tickets fetched successfully",
  "data": [ ...TicketResource[] ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 50,
    "last_page": 3
  }
}
```

**TicketResource fields:**
```json
{
  "id": 1,
  "ticket_code": "TCK-001",
  "user_id": 5,
  "user": { "id": 5, "name": "John Doe" },
  "support_id": 2,
  "support": { "id": 2, "name": "Admin Support" },
  "category_id": 1,
  "category": { "id": 1, "name": "Hardware" },
  "assets_id": 3,
  "nama_pembuat": "John Doe",
  "problem": "Komputer tidak bisa nyala",
  "status": "in_progress",
  "priority": "high",
  "solution": null,
  "image": null,
  "image_url": null,
  "notes": null,
  "request_date": "2026-05-01T08:00:00+07:00",
  "waiting_hour": 30,
  "start_date": "2026-05-01T08:30:00+07:00",
  "end_date": null,
  "time_spent": null,
  "is_late": 0,
  "created_at": "2026-05-01T08:00:00+07:00",
  "updated_at": "2026-05-01T08:30:00+07:00"
}
```

---

### `POST /user/ticket`

Buat ticket baru oleh user.

**Auth:** Bearer Token ✅

> ⚠️ Jika user masih punya ticket dengan status `resolved` yang belum diberi feedback, request ini akan ditolak `403`.

**Body:** `multipart/form-data`

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `problem` | string | ✅ | Deskripsi masalah |
| `category_id` | int | ✅ | ID kategori |
| `request_date` | datetime | ❌ | Default: now |
| `nama_pembuat` | string | ❌ | Nama pembuat (opsional) |
| `image` | file | ❌ | Foto/screenshot masalah |

**Response `201`:**
```json
{
  "message": "Ticket created successfully by user",
  "data": { ...TicketResource }
}
```

**Response `403`:**
```json
{ "message": "Silakan berikan feedback terlebih dahulu pada ticket yang sudah selesai." }
```

---

### `PUT /user/ticket/{id}`

Update ticket oleh user (misal edit problem atau ganti gambar).

**Auth:** Bearer Token ✅

**Body:** `multipart/form-data`

| Field | Type | Keterangan |
|---|---|---|
| `problem` | string | Deskripsi masalah |
| `image` | file | Ganti gambar (gambar lama dihapus) |

**Response `200`:**
```json
{
  "message": "Ticket Updated Successfully By User",
  "data": { ...TicketResource }
}
```

---

### `GET /user/supports`

Ambil daftar support/admin aktif (untuk dropdown pilih support di form).

**Auth:** Bearer Token ✅

**Response `200`:**
```json
{
  "message": "Support users fetched successfully",
  "data": [ ...UsersResource[] ]
}
```

---

### `POST /user/feedback/{id}`

Kirim feedback untuk ticket yang sudah resolved (id = ticket id).

**Auth:** Bearer Token ✅

**Body:**
```json
{
  "rating": 5,
  "comment": "Terima kasih, masalah sudah teratasi!"
}
```

**Response `201`:**
```json
{
  "message": "Feedback added successfully",
  "data": {
    "feedback": { "id": 1, "ticket_id": 10, "rating": 5, "comment": "..." },
    "ticket": { ...ticket dengan status 'feedback' }
  }
}
```

---

### `GET /user/category`

Ambil semua kategori ticket.

**Auth:** Bearer Token ✅

**Response `200`:**
```json
{
  "message": "Categories fetched successfully",
  "data": [
    { "id": 1, "name": "Hardware" },
    { "id": 2, "name": "Software" }
  ]
}
```

---

### `POST /user/category`

Tambah kategori baru.

**Auth:** Bearer Token ✅

**Body:**
```json
{ "name": "Jaringan" }
```

---

### `PUT /user/category/{id}` / `DELETE /user/category/{id}`

Update atau hapus kategori.

**Auth:** Bearer Token ✅

---

### `GET /user/reports/tickets`

Laporan ringkasan ticket milik user yang sedang login.

**Auth:** Bearer Token ✅

**Query Params:**

| Param | Type | Keterangan |
|---|---|---|
| `start_date` | date | Opsional |
| `end_date` | date | Opsional |

**Response `200`:**
```json
{
  "message": "Ticket report fetched successfully",
  "data": {
    "status": {
      "total": 10,
      "waiting": 2,
      "in_progress": 3,
      "resolved": 4,
      "feedback": 1,
      "void": 0
    }
  }
}
```

---

## Admin — Master Data

> Semua endpoint admin butuh auth dan role `admin`.

---

### Location

#### `GET /location`

Ambil semua lokasi.

**Response `200`:**
```json
{
  "message": "Locations fetched successfully",
  "data": [
    { "id": 1, "name": "Kantor Pusat", "address": "Jl. Sudirman No. 1" }
  ]
}
```

#### `POST /location`

**Body:**
```json
{ "name": "Kantor Cabang", "address": "Jl. Gatot Subroto" }
```

#### `PUT /location/{id}`

**Body:** sama seperti store.

#### `DELETE /location/{id}`

**Response `409`** jika lokasi masih dipakai oleh department.

---

### Asset

#### `GET /asset`

Ambil semua asset.

**Response `200`:**
```json
{
  "message": "Assets fetched successfully",
  "data": [
    { "id": 1, "assets_name": "Laptop Dell XPS", "serial_number": "SN-001" }
  ]
}
```

#### `POST /asset`

**Body:**
```json
{ "assets_name": "Monitor LG 24\"", "serial_number": "SN-002" }
```

#### `PUT /asset/{id}` / `DELETE /asset/{id}`

Standard CRUD.

---

## Admin — Users & Department

### `GET /department`

Ambil semua department (publik, tidak perlu auth).

**Response `200`:**
```json
{
  "message": "Departments fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "IT",
      "location_id": 1,
      "location": { "id": 1, "name": "Kantor Pusat" }
    }
  ]
}
```

---

### `POST /department` *(Admin)*

**Auth:** Bearer Token ✅ + Admin

**Body:**
```json
{ "name": "Finance", "location_id": 1 }
```

---

### `PUT /department/{id}` / `DELETE /department/{id}` *(Admin)*

**Response `409`** jika department masih punya user terkait.

---

### `GET /user` *(Admin)*

Ambil semua user.

**Response `200`:**
```json
{
  "message": "Users fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@pilargroup.id",
      "role": "user",
      "status": "active",
      "job_position": "Staff IT",
      "phone": "08xx",
      "department": { "id": 1, "name": "IT", "location": { ... } }
    }
  ]
}
```

---

### `POST /user` *(Admin)*

Buat user baru oleh admin (status langsung `active`).

**Body:**
```json
{
  "name": "Jane Doe",
  "username": "janedoe",
  "email": "jane@pilargroup.id",
  "password": "secret123",
  "role": "user",
  "department_id": 1,
  "job_position": "Staff HR",
  "phone": "08xx"
}
```

---

### `PUT /user/{id}` *(Admin)*

Update data user. Jika `password` diisi, token user akan di-revoke.

**Body:** field yang mau diupdate (semua opsional).

---

### `DELETE /user/{id}` *(Admin)*

Hapus user.

---

### `POST /approve-user/{id}` *(Admin)*

Approve user yang register sendiri (ubah status dari `inactive` ke `active`).

**Response `200`:**
```json
{
  "message": "User approved successfully",
  "data": { ...UsersResource }
}
```

---

### `GET /support` *(Admin)*

Ambil semua user dengan role `admin` (dipakai sebagai list support/teknisi).

**Response `200`:**
```json
{
  "message": "Support list",
  "data": [ ...UsersResource[] ]
}
```

---

### `GET /developer` *(Admin)*

Alias dari `/support` — ambil user role `admin` (label "developer" untuk konteks project).

---

## Admin — Tickets

### `GET /ticket/` *(Admin)*

Ambil semua ticket.

**Auth:** Bearer Token ✅ + Admin

**Query Params:**

| Param | Type | Keterangan |
|---|---|---|
| `status` | string | Filter status ticket |
| `start_date` | date | Filter tanggal request |
| `end_date` | date | Filter tanggal request |
| `per_page` | int | Default `20`, max `200` |
| `include_assets` | boolean | Sertakan relasi assets |

**Response `200`:** sama seperti `/user/tickets` dengan `meta` pagination.

---

### `POST /ticket/admin` *(Admin)*

Buat ticket oleh admin.

**Body:** `multipart/form-data`

| Field | Type | Wajib | Keterangan |
|---|---|---|---|
| `user_id` | int | ✅ | User yang punya ticket |
| `problem` | string | ✅ | Deskripsi masalah |
| `category_id` | int | ✅ | ID kategori |
| `support_id` | int | ❌ | ID support/teknisi |
| `priority` | string | ❌ | `low`, `medium`, `high` |
| `assets_id` | int | ❌ | ID asset terkait |
| `request_date` | datetime | ❌ | Default: now |
| `nama_pembuat` | string | ❌ | |
| `image` | file | ❌ | |

**Response `201`:**
```json
{
  "message": "Ticket created successfully by admin",
  "data": { ...TicketResource }
}
```

---

### `PUT /ticket/{id}` *(Admin)*

Update status ticket. Field yang dikirim bergantung pada `status` yang dipilih.

**Auth:** Bearer Token ✅ + Admin

#### Status: `waiting`
```json
{ "status": "waiting" }
```

#### Status: `in_progress`
```json
{
  "status": "in_progress",
  "support_id": 2,
  "priority": "high",
  "start_date": "2026-05-11T09:00",
  "assets_id": 3
}
```

| Field | Wajib | Keterangan |
|---|---|---|
| `support_id` | ✅ | |
| `priority` | ✅ | `low` / `medium` / `high` |
| `start_date` | ❌ | Default: now (jika belum ada) |
| `assets_id` | ❌ | |

#### Status: `resolved`
```json
{
  "status": "resolved",
  "support_id": 2,
  "priority": "high",
  "solution": "Sudah diganti RAM-nya",
  "end_date": "2026-05-11T12:00",
  "time_spent": 120,
  "notes": "Perlu cek ulang minggu depan"
}
```

| Field | Wajib | Keterangan |
|---|---|---|
| `support_id` | ✅ | |
| `priority` | ✅ | |
| `solution` | ✅ | |
| `end_date` | ❌ | Default: now |
| `time_spent` | ❌ | Dalam menit. Jika kosong, dihitung otomatis dari `start_date` s/d `end_date` |
| `notes` | ❌ | Catatan tambahan |

> `is_late` otomatis `1` jika `time_spent > 480` menit (8 jam).

#### Status: `void`
```json
{
  "status": "void",
  "notes": "Ticket dibatalkan karena duplikasi"
}
```

| Field | Wajib |
|---|---|
| `notes` | ✅ |

---

### `PATCH /ticket/resolved/{id}` *(Admin)*

Shortcut resolve ticket.

---

### `PATCH /ticket/cancel/{id}` *(Admin)*

Shortcut cancel ticket.

---

### `PATCH /ticket/void/{id}` *(Admin)*

Shortcut void ticket.

---

## Admin — Feedback

### `GET /feedback` *(Admin)*

Ambil semua feedback beserta rating rata-rata.

**Auth:** Bearer Token ✅ + Admin

**Response `200`:**
```json
{
  "message": "Feedback fetch successfully",
  "data": {
    "rating": {
      "average": 4.5,
      "total": 20
    },
    "list": [
      {
        "id": 1,
        "ticket_id": 10,
        "rating": 5,
        "comment": "Pelayanan sangat baik",
        "ticket": { ...ticket data }
      }
    ]
  }
}
```

---

## Admin — Projects

### `GET /project/` *(Admin)*

Ambil semua project.

**Auth:** Bearer Token ✅ + Admin

**Query Params:**

| Param | Type | Keterangan |
|---|---|---|
| `start_date` | date | Wajib berpasangan dengan `end_date` |
| `end_date` | date | Wajib berpasangan dengan `start_date` |

> Jika salah satu saja dikirim tanpa pasangannya, response `422`.

**Response `200`:**
```json
{
  "message": "Projects retrieved successfully",
  "data": [ ...ProjectResource[] ]
}
```

**ProjectResource fields:**
```json
{
  "id": 1,
  "project_code": "PRJ-001",
  "title": "Pengembangan Sistem HRD",
  "requestor_id": 5,
  "requestor": { "id": 5, "name": "Manager HR" },
  "status": "in_progress",
  "progress_percent": 60,
  "request_date": "2026-04-01",
  "start_date": "2026-04-05",
  "end_date": "2026-06-30",
  "actual_start_date": "2026-04-05T09:00:00+07:00",
  "actual_end_date": null,
  "effective_end_date": null,
  "total_pending_minutes": 120,
  "is_late": 0,
  "notes": null,
  "details": [ ...ProjectDetails[] ],
  "pendings": [ ...PendingData[] ]
}
```

---

### `POST /project/` *(Admin)*

Buat project baru.

**Auth:** Bearer Token ✅ + Admin

**Body:**
```json
{
  "title": "Pengembangan Modul Payroll",
  "requestor_id": 5,
  "request_date": "2026-05-01",
  "start_date": "2026-05-10",
  "end_date": "2026-07-31",
  "status": "waiting",
  "progress_percent": 0,
  "notes": "Prioritas tinggi"
}
```

**Response `201`:**
```json
{
  "message": "Project created successfully",
  "data": { ...ProjectResource }
}
```

---

### `PUT /project/{id}` *(Admin)*

Update status project. Field yang dikirim bergantung pada `status`.

**Auth:** Bearer Token ✅ + Admin

#### Status: `waiting`
```json
{ "status": "waiting" }
```

#### Status: `in_progress` (dari `waiting` → memanggil `start`)
```json
{
  "status": "in_progress",
  "developer_id": 3,
  "progress_percent": 10,
  "progress_date": "2026-05-11T09:00",
  "description": "Mulai analisis kebutuhan"
}
```

#### Status: `in_progress` (dari status lain → memanggil `progress`)
```json
{
  "status": "in_progress",
  "developer_id": 3,
  "progress_percent": 50,
  "description": "Selesai desain database"
}
```

#### Status: `pending` (hold)
```json
{
  "status": "pending",
  "reason": "Menunggu approval client",
  "description": "Client belum konfirmasi requirement"
}
```

| Field | Wajib |
|---|---|
| `reason` | ✅ |
| `description` | ❌ |

#### Status: `unhold`
```json
{
  "status": "unhold",
  "developer_id": 3,
  "include_pending_minutes": true,
  "description": "Lanjut setelah approval"
}
```

| Field | Wajib | Keterangan |
|---|---|---|
| `developer_id` | ❌ | Default: developer terakhir |
| `include_pending_minutes` | ❌ | Jika `true`, durasi hold ditambahkan ke effective end date |
| `description` | ❌ | |

#### Status: `void`
```json
{
  "status": "void",
  "notes": "Project dibatalkan",
  "description": "Budget tidak tersedia"
}
```

#### Status: `resolved`
```json
{
  "status": "resolved",
  "actual_end_date": "2026-06-30T17:00",
  "include_pending_minutes": false,
  "description": "Project selesai dan sudah live"
}
```

---

### Endpoint Status Individual *(Admin)*

Selain lewat `PUT /project/{id}`, bisa juga panggil endpoint masing-masing langsung:

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/project/{id}/start` | Mulai project |
| `POST` | `/project/{id}/progress` | Update progress |
| `POST` | `/project/{id}/hold` | Hold/pending project |
| `POST` | `/project/{id}/unhold` | Lanjutkan dari hold |
| `POST` | `/project/{id}/void` | Void project |
| `POST` | `/project/{id}/resolve` | Resolve project |

Body tiap endpoint sama seperti di `PUT /project/{id}` section masing-masing status di atas.

---

### `GET /project/{id}/history` *(Admin)*

Ambil riwayat perubahan status project.

**Auth:** Bearer Token ✅ + Admin

**Response `200`:**
```json
{
  "message": "Project history retrieved successfully",
  "history": [
    {
      "id": 1,
      "type": "in_progress",
      "progress_date": "2026-05-01T09:00:00+07:00",
      "created_at": "2026-05-01T09:00:00+07:00",
      "progress_percent": 10,
      "description": "Mulai analisis",
      "pending_minutes": null,
      "by_name": "Developer A",
      "developer_id": 3
    }
  ]
}
```

---

## Admin — Reports

### Ticket Reports

#### `GET /reports/ticket-all` *(Admin)*

Ringkasan semua ticket (count per status + SLA).

**Query Params:**

| Param | Type | Keterangan |
|---|---|---|
| `start_date` | date | Opsional |
| `end_date` | date | Opsional |

**Response `200`:**
```json
{
  "message": "Ticket report fetched successfully",
  "data": {
    "status": {
      "total": 100,
      "waiting": 10,
      "in_progress": 20,
      "resolved": 60,
      "feedback": 5,
      "void": 5
    },
    "sla": {
      "on_time": 55,
      "late": 5,
      "percentage_on_time": 91.67
    }
  }
}
```

---

#### `GET /reports/tickets/per-month` *(Admin)*

Jumlah ticket per bulan dalam satu tahun.

**Query Params:**

| Param | Type | Default | Keterangan |
|---|---|---|---|
| `year` | int | tahun sekarang | Tahun yang mau dilihat |

**Response `200`:**
```json
{
  "message": "Tickets per month fetched successfully",
  "data": [
    { "year": 2026, "month": 1, "count": 15 },
    { "year": 2026, "month": 2, "count": 22 },
    ...
  ]
}
```

---

#### `GET /reports/tickets/time-spent-per-month-department` *(Admin)*

Total waktu pengerjaan ticket (menit) per bulan, dikelompokkan per department user.

**Query Params:**

| Param | Type | Default |
|---|---|---|
| `year` | int | tahun sekarang |

**Response `200`:**
```json
{
  "message": "...",
  "meta": { "year": 2026 },
  "chart": {
    "labels": [1,2,3,4,5,6,7,8,9,10,11,12],
    "series": [
      {
        "department_id": 1,
        "department_name": "IT",
        "data_minutes": [120, 240, 180, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      }
    ]
  },
  "raw": [ ...flat data ]
}
```

---

#### `GET /reports/tickets/distribution-category` *(Admin)*

Distribusi jumlah ticket per kategori.

**Query Params:** `start_date` ✅, `end_date` ✅ (wajib)

**Response `200`:**
```json
{
  "message": "...",
  "data": [
    { "category_id": 1, "category_name": "Hardware", "count": 30 },
    { "category_id": 2, "category_name": "Software", "count": 20 }
  ]
}
```

---

#### `GET /reports/tickets/sla` *(Admin)*

Laporan SLA detail.

**Query Params:** `start_date` ✅, `end_date` ✅ (wajib)

**Response `200`:**
```json
{
  "message": "SLA report fetched successfully",
  "data": {
    "on_time": 55,
    "late": 5,
    "percentage_on_time": 91.67
  }
}
```

---

#### `GET /reports/tickets/preview` *(Admin)*

Preview data ticket sebelum export (dengan pagination).

**Query Params:**

| Param | Type | Default | Keterangan |
|---|---|---|---|
| `start_date` | date | hari ini | |
| `end_date` | date | hari ini | |
| `status` | string | semua | Filter status |
| `per_page` | int | 50 | |

**Response `200`:** paginated TicketCollection.

---

#### `GET /reports/tickets/export` *(Admin)*

Download file Excel ticket.

**Query Params:** sama seperti preview (tanpa `per_page`).

**Response:** File `.xlsx` download.

---

### Support Reports

#### `GET /reports/supports/summary` *(Admin)*

Ringkasan performa per support/teknisi.

**Query Params:**

| Param | Type | Default |
|---|---|---|
| `start_date` | date | awal bulan ini |
| `end_date` | date | akhir bulan ini |
| `status` | string | all |

**Response `200`:**
```json
{
  "message": "...",
  "meta": { "start_date": "...", "end_date": "...", "status": "all" },
  "data": [
    {
      "support_id": 2,
      "support_name": "Admin A",
      "total_tickets": 30,
      "resolved_tickets": 25,
      "open_tickets": 5,
      "late_tickets": 2,
      "total_minutes": 3600
    }
  ]
}
```

---

#### `GET /reports/supports/tickets-per-month` *(Admin)*

Jumlah ticket per bulan per support.

**Query Params:**

| Param | Type | Default |
|---|---|---|
| `year` | int | tahun sekarang |
| `start_date` | date | 1 Jan tahun itu |
| `end_date` | date | 31 Des tahun itu |

**Response `200`:** struktur `chart.series` sama seperti time-spent, tapi field `data` (count), bukan `data_minutes`.

---

#### `GET /reports/supports/time-spent-per-month` *(Admin)*

Total menit pengerjaan per bulan per support.

**Query Params:** sama seperti tickets-per-month.

**Response `200`:** `chart.series[].data_minutes` berisi array 12 bulan.

---

#### `GET /reports/supports/{supportId}/tickets` *(Admin)*

Detail ticket-ticket yang ditangani oleh support tertentu.

**Query Params:**

| Param | Type | Default |
|---|---|---|
| `start_date` | date | hari ini |
| `end_date` | date | hari ini |
| `status` | string | all |
| `per_page` | int | 50 |

**Response `200`:** paginated TicketCollection.

---

### Project Reports

#### `GET /reports/projects/summary` *(Admin)*

Ringkasan project per tahun (count per status).

**Query Params:**

| Param | Type | Default |
|---|---|---|
| `year` | int | tahun sekarang |

---

#### `GET /reports/projects/gantt` *(Admin)*

Data project untuk tampilan Gantt chart.

**Query Params:**

| Param | Type | Default | Keterangan |
|---|---|---|---|
| `year` | int | tahun sekarang | |
| `start_date` | date | 1 Jan | Override window |
| `end_date` | date | 31 Des | Override window |
| `status` | string | all | Filter status |
| `q` | string | — | Search project code/name |

**Response `200`:**
```json
{
  "message": "...",
  "meta": { "year": 2026, "start_date": "...", "end_date": "...", "status": "all", "q": null },
  "data": [ ...gantt rows ]
}
```

---

#### `GET /reports/projects/gantt-detail` *(Admin)*

Detail Gantt satu project spesifik.

**Query Params:**

| Param | Type | Wajib |
|---|---|---|
| `project_id` | int | ✅ |

---

#### `GET /reports/projects/preview` *(Admin)*

Preview export project (dengan pagination).

**Query Params:**

| Param | Type | Default |
|---|---|---|
| `year` | int | tahun sekarang |
| `status` | string | all |
| `q` | string | — |
| `per_page` | int | 50 |

---

#### `GET /reports/projects/export` *(Admin)*

Download file Excel project details.

**Query Params:** sama seperti preview (tanpa `per_page`).

**Response:** File `.xlsx` download.

---

### Developer Reports

#### `GET /reports/developers/projects/summary` *(Admin)*

Ringkasan project per developer.

**Query Params:**

| Param | Type | Default |
|---|---|---|
| `year` | int | tahun sekarang |
| `status` | string | all |
| `q` | string | — |

**Response `200`:**
```json
{
  "message": "...",
  "meta": { "year": 2026, "status": "all", "q": null },
  "data": [ ...developer summary rows ]
}
```

---

#### `GET /reports/developers/{developerId}/projects` *(Admin)*

Detail project yang dikerjakan developer tertentu.

**Query Params:**

| Param | Type | Default |
|---|---|---|
| `year` | int | tahun sekarang |
| `status` | string | all |
| `q` | string | — |
| `per_page` | int | 50 |

---

## Response Format Umum

### Success
```json
{
  "message": "...",
  "data": { } // atau []
}
```

### Validation Error (`422`)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": ["Pesan error"]
  }
}
```

### Unauthorized (`401`)
```json
{ "message": "Unauthenticated." }
```

### Forbidden (`403`)
```json
{ "message": "Unauthorized" }
```

### Not Found (`404`)
```json
{ "message": "No query results for model..." }
```

---

## Status Ticket

| Status | Keterangan |
|---|---|
| `waiting` | Ticket masuk, belum diproses |
| `in_progress` | Sedang dikerjakan |
| `resolved` | Selesai, menunggu feedback user |
| `feedback` | Sudah ada feedback dari user |
| `void` | Dibatalkan |

---

## Status Project

| Status | Keterangan |
|---|---|
| `waiting` | Project masuk, belum mulai |
| `in_progress` | Sedang dikerjakan |
| `pending` | Di-hold sementara |
| `resolved` | Project selesai |
| `void` | Project dibatalkan |

---

*Dokumentasi ini dibuat berdasarkan source code backend Laravel 12. Jika ada perubahan di BE, pastikan dokumentasi ini diupdate juga.*