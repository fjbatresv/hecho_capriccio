# Hecho Capriccio — Landing de Roles Artesanales

[![CI](https://github.com/fjbatresv/hecho_capriccio/actions/workflows/ci.yml/badge.svg)](https://github.com/fjbatresv/hecho_capriccio/actions/workflows/ci.yml)
[![Snyk](https://github.com/fjbatresv/hecho_capriccio/actions/workflows/snyk.yml/badge.svg)](https://github.com/fjbatresv/hecho_capriccio/actions/workflows/snyk.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fjbatresv_hecho_capriccio&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=fjbatresv_hecho_capriccio)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=fjbatresv_hecho_capriccio&metric=coverage)](https://sonarcloud.io/summary/new_code?id=fjbatresv_hecho_capriccio)
![Node](https://img.shields.io/badge/Node-24.x-339933?logo=node.js&logoColor=white)
![ESLint](https://img.shields.io/badge/Lint-ESLint-4B32C3?logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Code%20Style-Prettier-ff69b4?logo=prettier&logoColor=white)
![Jest](https://img.shields.io/badge/Tested%20with-Jest-99424f?logo=jest&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![AWS S3](https://img.shields.io/badge/AWS%20S3-569A31?logo=amazonaws&logoColor=white)
![CloudFront](https://img.shields.io/badge/CloudFront-8C4FFF?logo=amazonaws&logoColor=white)

Sitio estático en una sola página con carrito en memoria (localStorage) y generación dinámica de mensaje para WhatsApp.

## Estructura

- `index.html`: marcado principal, metadatos y puntos de anclaje.
- `style.css`: estilos, incluyendo el widget flotante del carrito.
- `script.js`: lógica de navegación, animaciones, carrito y armado de mensaje para WhatsApp.
- `assets/`: imágenes optimizadas (JPEG + WebP) y documentos (catálogo PDF).
- `.github/workflows/deploy.yml`: flujo de despliegue a S3 con invalidación de CloudFront, compresión de imágenes y headers de caché.

## Desarrollo local

1. Clona el repo.
2. Usa Node `v24` (`.nvmrc`) y `npm install` para instalar dev-deps.
3. Abre `index.html` en el navegador o sirve la carpeta con cualquier servidor estático (`npx serve .`).

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
- Sentry (opcional para releases/sourcemaps en deploy): `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`

Opcional: ajusta `AWS_REGION` en el workflow si no usas `us-east-1`.

## Notas de performance

- Imágenes están redimensionadas y tienen variantes WebP; mantener las dimensiones (`width`/`height`) cuando agregues nuevas.
- Iconografía es un sprite SVG inline (sin dependencias externas).
- El deploy fija `Cache-Control: public,max-age=31536000,immutable` para assets estáticos y `max-age=300` para `index.html`.
- Si habilitas compresión automática en CloudFront, Lighthouse dejará de marcar `uses-text-compression`.

## Notas

- Los botones de producto usan `Agregar al carrito` y generan un mensaje resumido para WhatsApp con cantidades.
- El carrito se persiste en `localStorage`; al vaciarlo desaparece el FAB de compra.
- Integración Sentry (opcional): agrega en `index.html` los metas `sentry-dsn` y `sentry-release` con tus valores y deja el CDN de Sentry habilitado. La inicialización usa tracing (10%) y replays (5% de sesiones, 100% on error); ajusta en `script.js` si necesitas otros ratios.
- En el deploy, si configuras los secretos de Sentry, el workflow inyecta DSN/release en `index.html`, crea release con `sentry-cli` y sube sourcemaps cuando existan.

## Tooling y calidad

- Instala dependencias con `npm install` (Node 24.x).
- Lint: `npm run lint`. Formato: `npm run prettier:check` (o `prettier:write` para aplicar) con ESLint + Prettier.
- Tests con cobertura mínima global de 80% (Jest + jsdom): `npm run test:coverage` (actualmente 100% líneas, 97% ramas).
- Validación de HTML: `npm run html-validate` (html-validate).
- Revisión de enlaces internos: `npm run check:links` (omitiendo externos; en entornos sin permisos de red se auto-salta con aviso).
- Hook de pre-commit (Husky) ejecuta lint, prettier:check, tests, html-validate y check:links tras `npm install` (script `prepare`).
- Pipelines: CI en `.github/workflows/ci.yml` corre el set de cheques en pushes y PRs; escaneo Snyk (`.github/workflows/snyk.yml`); análisis SonarCloud (`.github/workflows/sonar.yml`).
