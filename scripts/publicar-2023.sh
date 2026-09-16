#!/usr/bin/env bash
# Rebuilds the 2023 site folder from the tagged GitHub Pages build and proves it
# is byte-identical before anything is deployed.
#
# It does not compile anything. The point of the 2023 site is to show what was
# delivered; a fresh build of that source today is a different artifact.
#
# Its index.html loads JS and CSS from /calendar-reminder/static/..., an absolute
# path, so the files are served under /calendar-reminder/ and / redirects there.
#
#   bash scripts/publicar-2023.sh public                      # lo pone dentro del producto
#   SOLO_VERIFICAR=1 bash scripts/publicar-2023.sh <carpeta>  # verifica lo que ya hay
#   CON_REDIRECCION=1 bash scripts/publicar-2023.sh <carpeta> # además, sitio aparte: / redirige
#
# El destino normal es `public/`, que Vite copia tal cual al build: así los dos sitios
# viven en el mismo dominio y el de 2023 queda en /calendar-reminder/, que es justo la
# ruta que su index.html pide. Los archivos van versionados porque Vercel construye
# desde un clon sin tags: aquí no se pueden extraer en tiempo de build.
set -euo pipefail

BUILD=v2023-jobsity-build
ESPERADOS=12
RAIZ="$(git rev-parse --show-toplevel)"
DEST="${1:?Uso: publicar-2023.sh <carpeta>}"

if [ -z "${SOLO_VERIFICAR:-}" ]; then
  rm -rf "$DEST/calendar-reminder"
  mkdir -p "$DEST/calendar-reminder"
  git -C "$RAIZ" archive "$BUILD" | tar -x -C "$DEST/calendar-reminder"
fi

n=0
while IFS=$'\t' read -r meta ruta; do
  hash=$(echo "$meta" | awk '{print $3}')
  real=$(git -C "$RAIZ" hash-object "$DEST/calendar-reminder/$ruta")
  if [ "$real" != "$hash" ]; then
    echo "DIFIERE del build de 2023: $ruta" >&2
    exit 1
  fi
  n=$((n + 1))
done < <(git -C "$RAIZ" ls-tree -r "$BUILD")

if [ "$n" -ne "$ESPERADOS" ]; then
  echo "Esperaba $ESPERADOS archivos, hay $n" >&2
  exit 1
fi

if [ -n "${CON_REDIRECCION:-}" ]; then
  cat > "$DEST/vercel.json" <<'JSON'
{
  "redirects": [
    { "source": "/", "destination": "/calendar-reminder/", "permanent": false }
  ]
}
JSON
fi

echo "$n archivos idénticos al build de 2023 en $DEST"
