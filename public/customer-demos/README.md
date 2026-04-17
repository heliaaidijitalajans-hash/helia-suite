# Müşteri demo projeleri — dosya yükleme alanı

Bu klasör, **Helia Suite web sitesinde** ziyaretçilerin inceleyebileceği **statik demo sitelerinizi** tutar.

## 1. Klasör yapısı

Her demo için **küçük harf**, rakam ve tire (`-`) kullanan bir klasör adı seçin:

```
public/customer-demos/
  benim-projem/
    index.html       ← Zorunlu (giriş dosyası)
    style.css        ← İsteğe bağlı
    app.js           ← İsteğe bağlı
    assets/          ← İsteğe bağlı alt klasörler
```

Tarayıcıda açılan adres örneği:

`https://alanadiniz.com/customer-demos/benim-projem/index.html`

Önizleme sayfası (`/[dil]/demos/benim-projem`) bu adresi çerçeve içinde gösterir.

## 2. Listede görünmesi için kayıt

Aynı `slug` değerini projede şu dosyaya ekleyin:

**`src/data/customer-demos.json`**

Örnek (statik dosya):

```json
{
  "slug": "benim-projem",
  "title": "My project",
  "titleTr": "Projem",
  "description": "Short description for the gallery card.",
  "descriptionTr": "Galeri kartı için kısa açıklama."
}
```

**Yerleşik Helia demoları** (statik klasör gerekmez): `embedUrl` alanına `/demo/ai`, `/demo/market`, `/demo/learn` veya `/demo/health` yazın. Varsayılan kayıtlar bu dörtlüyü içerir.

- Statik demo için: `slug`, `public/customer-demos/` altındaki klasör adı ile **aynı** olmalıdır (`embedUrl` yoksa).
- `title` / `description` → İngilizce sayfa (`/en/demos`)
- `titleTr` / `descriptionTr` → Türkçe sayfa (`/tr/demos`)

## 3. Güvenlik

- Sadece `a-z`, `0-9` ve `-` kullanın (slug doğrulaması buna göre).
- Harici script / iframe kaynaklarına dikkat edin; yüklediğiniz `index.html` ziyaretçi tarayıcısında çalışır.

## 4. Yerel test

```bash
npm run dev
```

- Liste: `http://localhost:3000/tr/demos` veya `/en/demos`
- Kayıt yokken galeri boş mesajı gösterir; `customer-demos.json` ve `public/customer-demos/<slug>/` ekledikten sonra kartlar görünür

---

# Customer demos (English)

Same rules: put each project under `public/customer-demos/<slug>/` with **`index.html`**, then register the same **`slug`** in **`src/data/customer-demos.json`**.
