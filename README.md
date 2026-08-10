# TCG Tools

เว็บเครื่องมือช่วยเล่นการ์ด TCG ออกแบบมาให้ **วางมือถือไว้กลางโต๊ะแล้วผู้เล่นทั้งสองฝ่ายกดเอง**
ตัวเลขใหญ่ ปุ่มใหญ่ อ่านออกจากระยะห่างโต๊ะ

เปิดใช้ได้ที่ https://chanopk.github.io/tcgtools/

## เกมที่รองรับตอนนี้

### Palworld Official Card Game (Bushiroad)

จอเดียวเห็นทั้งสองฝ่าย ฝั่งตรงข้ามหมุน 180° ให้อ่านได้จากอีกด้านของโต๊ะ

| ตัวนับ | เริ่มต้น | ช่วงค่า |
| --- | --- | --- |
| Life | 10 | 0–99 (เหลือ 0 = อีกฝ่ายชนะ) |
| Material (วัตถุดิบ) | 0 | 0–99 |
| Ingredient (ส่วนผสม) | 0 | 0–99 |

ฟีเจอร์อื่น

- **เริ่มใหม่** — คืนค่าทุกตัวนับกลับไปตั้งต้น มีถามยืนยันกันกดพลาด
- **กันจอดับ** — ใช้ Screen Wake Lock API ขอสิทธิ์ใหม่อัตโนมัติเมื่อสลับกลับมาที่แท็บ กดปิดได้จากแถบกลางจอ
- **จำค่าอัตโนมัติ** — เก็บลง `localStorage` รีเฟรชหรือเผลอปิดแท็บกลางเกมแล้วค่าไม่หาย

> Pal แต่ละตัวบนสนามมี damage สะสมภายในเทิร์นและถูกล้างทุก End Phase
> อ่านจากการ์ดจริงบนโต๊ะได้เลย แอปนี้จึงไม่จดให้

## รันในเครื่อง

```bash
npm install
npm run dev      # http://localhost:5173/tcgtools/
npm run build    # ออกเป็น static ที่ dist/
npm run preview
```

## Deploy

Push ขึ้น `main` แล้ว `.github/workflows/deploy.yml` จะ build และ deploy ขึ้น GitHub Pages ให้เอง

ครั้งแรกต้องตั้งค่าที่ **Settings → Pages → Build and deployment → Source: GitHub Actions** ก่อนหนึ่งครั้ง

`base` ใน `vite.config.ts` ตั้งเป็น `/tcgtools/` ตามชื่อ repo — ถ้าเปลี่ยนชื่อ repo ต้องแก้ตรงนี้ด้วย
และแอปใช้ `HashRouter` เพราะ GitHub Pages ไม่มี rewrite ฝั่ง server รีเฟรชหน้าลึก ๆ จึงไม่ 404

## เพิ่มเกมใหม่

ไม่ต้องแตะ UI — เพิ่มอ็อบเจ็กต์เดียวใน [`src/games/registry.ts`](src/games/registry.ts)

```ts
const myGame: GameDef = {
  id: 'my-game',
  name: 'ชื่อเกม',
  subtitle: 'คำโปรย',
  emoji: '🎴',
  ready: true,
  counters: [
    { key: 'life', label: 'Life', initial: 20, min: 0, max: 99, step: 1, role: 'primary' },
    // role: 'resource' = ตัวนับเล็กเรียงเป็นแถวด้านล่าง
  ],
  loseWhen: { key: 'life', value: 0 },
}
```

แล้วใส่ใน `GAMES` — หน้าแรกและหน้าตัวนับจะรองรับเองทันที

- `role: 'primary'` มีได้ตัวเดียวต่อเกม แสดงเป็นตัวเลขยักษ์กลางฝั่ง
- `role: 'resource'` ใส่ได้หลายตัว แสดงเป็นการ์ดเล็กเรียงกันด้านล่าง (2 ตัวกำลังพอดีจอมือถือ)

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router (HashRouter) — static ล้วน ไม่มี backend
