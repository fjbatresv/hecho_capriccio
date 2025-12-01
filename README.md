# Hecho Capriccio — Landing de Roles Artesanales

Sitio estático en una sola página con carrito en memoria (localStorage) y generación dinámica de mensaje para WhatsApp.

## Estructura
- `index.html`: marcado principal, metadatos y puntos de anclaje.
- `style.css`: estilos, incluyendo el widget flotante del carrito.
- `script.js`: lógica de navegación, animaciones, carrito y armado de mensaje para WhatsApp.
- `assets/`: imágenes optimizadas (JPEG + WebP) y documentos (catálogo PDF).
- `.github/workflows/deploy.yml`: flujo de despliegue a S3 con invalidación de CloudFront, compresión de imágenes y headers de caché.

## Desarrollo local
1. Clona el repo.
2. Abre `index.html` en el navegador o sirve la carpeta con cualquier servidor estático (`npx serve .`).

## Despliegue (GitHub Actions)
El workflow se ejecuta en pushes a `main`/`master` y realiza:
- Compresión de imágenes en `assets/img` con `imagemin` (mozjpeg, pngquant).
- `aws s3 sync` del repo al bucket (excluye `.git`, `.github`, `node_modules`).
- Invalidación completa de la distribución de CloudFront.

### Variables/secretos requeridos
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET` (nombre del bucket destino)
- `CLOUDFRONT_DISTRIBUTION_ID`

Opcional: ajusta `AWS_REGION` en el workflow si no usas `us-east-1`.

## Notas de performance
- Imágenes están redimensionadas y tienen variantes WebP; mantener las dimensiones (`width`/`height`) cuando agregues nuevas.
- Iconografía es un sprite SVG inline (sin dependencias externas).
- El deploy fija `Cache-Control: public,max-age=31536000,immutable` para assets estáticos y `max-age=300` para `index.html`.
- Si habilitas compresión automática en CloudFront, Lighthouse dejará de marcar `uses-text-compression`.

## Notas
- Los botones de producto usan `Agregar al carrito` y generan un mensaje resumido para WhatsApp con cantidades.
- El carrito se persiste en `localStorage`; al vaciarlo desaparece el FAB de compra.***
