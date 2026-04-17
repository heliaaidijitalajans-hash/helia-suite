# `customer-demos.json`

Bu dosya, sitede **hangi demoların listeleneceğini** tanımlar.

- Her kayıt bir **`slug`** içerir (URL: `/<dil>/demos/<slug>`).
- **Statik HTML:** `public/customer-demos/<slug>/index.html` dosyasını yükleyin; `embedUrl` kullanmayın.
- **Yerleşik interaktif demo:** `embedUrl` alanına yalnızca şu adreslerden biri yazılabilir: `/demo/ai`, `/demo/market`, `/demo/learn`, `/demo/health` (Helia Suite içindeki mobil önizlemeler).
- Ayrıntılı yükleme talimatı: **`public/customer-demos/README.md`**

Harici `helia-marketplace-demo` klasörü referans içindi; dört model bu repoda **`/demo/...`** rotaları olarak zaten çalışır ve galeri bu kayıtlarla onları listeler.
