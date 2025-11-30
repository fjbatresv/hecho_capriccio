# Hecho Capriccio — Landing de Roles Artesanales

Sitio estático en una sola página con carrito en memoria (localStorage) y generación dinámica de mensaje para WhatsApp.

## Estructura
- `index.html`: marcado principal, metadatos y puntos de anclaje.
- `style.css`: estilos, incluyendo el widget flotante del carrito.
- `script.js`: lógica de navegación, animaciones, carrito y armado de mensaje para WhatsApp.
- `assets/`: imágenes y documentos (catálogo PDF).
- `.github/workflows/deploy.yml`: flujo de despliegue a S3 con invalidación de CloudFront y compresión de imágenes.

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

## Notas
- Los botones de producto usan `Agregar al carrito` y generan un mensaje resumido para WhatsApp con cantidades.
- El carrito se persiste en `localStorage`; al vaciarlo desaparece el FAB de compra.***
