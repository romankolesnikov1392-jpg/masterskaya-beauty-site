# Сборка

Сайт отдаёт минифицированные файлы: `styles.min.css`, `script.min.js`,
а критический CSS вшит прямо в `<head>` файла `index.html`.
Исходники — `styles.css` и `script.js`, их и правят.

## После правки стилей или скриптов

```
cd tools
npm i esbuild
node build.js
```

Скрипт пересобирает `styles.min.css`, `script.min.js` и `assets/critical.css`.
Затем **вручную** подставьте свежий `assets/critical.css` в тег `<style>`
в `<head>` и поднимите версию `?v=N` у всех ссылок на css/js —
иначе браузеры и CDN GitHub Pages отдадут старые файлы из кеша.

## Картинки

```
npm i sharp
node convert-images.js
```

Берёт исходники из `assets/photos` и `assets/gallery`, кладёт в `assets/img`
webp в трёх размерах плюс jpg-фоллбэк, обновляет `assets/img/manifest.json`.
Качество webp — 78.

## Шрифты

```
npm i subset-font
node fetch-fonts.js    # скачивает woff2 с Google, оставляет cyrillic + latin
node subset-fonts.js   # режет латиницу до используемых символов
```

Латиница нужна почти только под цифры: телефон, цены, «5,0», номера шагов.
Полная латиница Unbounded весит 116 КБ на начертание, обрезанная — 1 КБ.
