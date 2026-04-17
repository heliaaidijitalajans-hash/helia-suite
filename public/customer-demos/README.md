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

Örnek:

```json
{
  "slug": "benim-projem",
  "title": "My project",
  "titleTr": "Projem",
  "description": "Short description for the gallery card.",
  "descriptionTr": "Galeri kartı için kısa açıklama."
}
```

- `slug` = `public/customer-demos/` altındaki klasör adı ile **aynı** olmalıdır.
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
- Örnek demo: `ornek` klasörü ve `customer-demos.json` içindeki ilk kayıt

---

# Customer demos (English)

Same rules: put each project under `public/customer-demos/<slug>/` with **`index.html`**, then register the same **`slug`** in **`src/data/customer-demos.json`**.
