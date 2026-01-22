# Timestamp - Camera-first Timestamp Logger

แอป Android สำหรับถ่ายรูปพร้อม timestamp overlay

## Features

- 📷 ถ่ายรูปจากกล้อง (หน้า/หลัง)
- 📥 นำเข้ารูปจากเครื่อง (หลายรูป)
- 🕐 Timestamp overlay 2 บรรทัด (Network/Local)
- 📍 Location overlay (Lat/Lng + ที่อยู่)
- 🗺️ เลือกตำแหน่งบนแผนที่ (Leaflet + OSM)
- 💾 ดาวน์โหลดรายรูป / ทั้งหมด (ZIP)
- 🔒 ข้อมูลถาวรในเครื่อง (IndexedDB)
- 📐 Preset sizes (แนวตั้ง/แนวนอน)
- 🎨 Dark theme

## Tech Stack

- React 18 + TypeScript + Vite
- Capacitor 6 (Android)
- Dexie.js (IndexedDB)
- Leaflet + OpenStreetMap
- JSZip

## Development

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
cd Timestamp
npm install
```

### Run Dev Server

```bash
npm run dev
```

เปิด http://localhost:5173 ในเบราว์เซอร์

### Build for Production

```bash
npm run build
```

## Android Build

### Local Build (ต้องมี Android SDK)

```bash
# Add Android platform (ครั้งแรก)
npx cap add android

# Sync web build to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Build with Codemagic (Recommended)

1. Push โค้ดขึ้น GitHub
2. เชื่อม repo กับ Codemagic
3. ตั้งค่า Environment Variables สำหรับ signing (ถ้าต้องการ release)
4. Trigger build

## Codemagic Configuration

### Environment Variables (สำหรับ Release Signing)

ใน Codemagic UI, สร้าง group `keystore_credentials` และเพิ่ม:

| Variable | Description |
|----------|-------------|
| `CM_KEYSTORE` | Base64-encoded keystore file |
| `CM_KEYSTORE_PASSWORD` | Keystore password |
| `CM_KEY_ALIAS` | Key alias |
| `CM_KEY_PASSWORD` | Key password |

### สร้าง Keystore

```bash
keytool -genkey -v -keystore release.keystore -alias timestamp -keyalg RSA -keysize 2048 -validity 10000
```

### Encode Keystore เป็น Base64

```bash
base64 -i release.keystore -o keystore_base64.txt
```

นำค่าจาก `keystore_base64.txt` ไปใส่ใน `CM_KEYSTORE`

## Project Structure

```
Timestamp/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main app component
│   ├── App.css               # App styles
│   ├── index.css             # Global styles
│   ├── components/
│   │   ├── Topbar/           # Top navigation
│   │   ├── Stage/            # Camera viewfinder
│   │   ├── BottomControls/   # Gallery & buttons
│   │   ├── modals/           # Preview, Settings, Map
│   │   └── common/           # Toast
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities
│   ├── context/              # React Context
│   └── types/                # TypeScript types
├── public/
├── android/                  # Capacitor Android project
├── capacitor.config.ts
├── codemagic.yaml
├── package.json
└── README.md
```

## Acceptance Criteria

- [ ] กล้องเปิด/ปิดได้ สลับกล้องหน้า/หลังได้
- [ ] แฟลช (Torch) เปิด/ปิดได้บนอุปกรณ์ที่รองรับ
- [ ] ถ่ายรูปได้ตรงกับที่เห็นใน viewfinder
- [ ] นำเข้ารูปหลายรูปพร้อมกันได้
- [ ] รูปยังอยู่หลังปิดแอปแล้วเปิดใหม่ (persistence)
- [ ] Preview แสดง overlay ถูกต้อง
- [ ] ตั้งเวลารายรูปได้
- [ ] ดาวน์โหลดรายรูปได้ (JPG/PNG)
- [ ] ดาวน์โหลดทั้งหมดได้ (ZIP/Folder/Sequential)
- [ ] Preset frame guide แสดงบน viewfinder
- [ ] เลือก preset size แนวตั้ง/แนวนอนได้
- [ ] เปิด location overlay ได้
- [ ] ใช้ GPS ปัจจุบันได้
- [ ] เลือกตำแหน่งบนแผนที่ได้
- [ ] ค้นหาสถานที่ได้ (forward geocode)
- [ ] Log panel แสดง error ได้
- [ ] Build APK บน Codemagic ได้

## License

MIT
