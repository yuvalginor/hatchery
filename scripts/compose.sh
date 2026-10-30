#!/usr/bin/env bash
# Builds a project from recipes: base first, then each named recipe in order.
# Usage: scripts/compose.sh <dir> <recipe>...    e.g. scripts/compose.sh /home/user/my-app web web-storage pwa
# Recipes only add files. Two files merge instead of conflicting:
#   project.json  keys are added; a key that already exists is a conflict.
#   .gitignore    lines are appended.
# Any other file that a second recipe or <dir> already has is a conflict. On a conflict nothing is written.
# A recipe's NEEDS file lists the recipes that must come before it.
# Also copies the Karpathy skill and records the hatchery version and the recipes in project.json.
# Runs on bash 3.2, so it works on macOS as well as in cloud sessions.
set -euo pipefail
HATCHERY=$(cd "$(dirname "$0")/.." && pwd)
dest=${1:?usage: compose.sh <dir> <recipe>...}
shift
recipes=(base "$@")
fail() { echo "compose.sh: $*" >&2; exit 1; }

files() { # tracked-style file list of a recipe, without build output
  (cd "$HATCHERY/recipes/$1" && find . -type f \
    ! -name RECIPE.md ! -name NEEDS ! -path './node_modules/*' ! -path './dist/*' ! -path './test-results/*' \
    | sed 's|^\./||' | sort)
}

seen=" "
for recipe in "${recipes[@]}"; do
  [ -d "$HATCHERY/recipes/$recipe" ] || fail "no recipe named '$recipe'"
  case "$seen" in *" $recipe "*) fail "recipe '$recipe' is listed twice" ;; esac
  if [ -f "$HATCHERY/recipes/$recipe/NEEDS" ]; then
    for need in $(cat "$HATCHERY/recipes/$recipe/NEEDS"); do
      case "$seen" in *" $need "*) ;; *) fail "recipe '$recipe' needs '$need' listed before it" ;; esac
    done
  fi
  seen="$seen$recipe "
done

work=$(mktemp -d)
owners=$(mktemp) # "<recipe> <file>" per copied file, to name both sides of a conflict
trap 'rm -rf "$work" "$owners"' EXIT
for recipe in "${recipes[@]}"; do
  src="$HATCHERY/recipes/$recipe"
  while IFS= read -r file; do
    case "$file" in
      project.json)
        if [ -f "$work/project.json" ]; then
          clash=$(jq -r -n --slurpfile a "$work/project.json" --slurpfile b "$src/project.json" '[$b[0] | keys[] | select(in($a[0]))] | join(", ")')
          [ -z "$clash" ] || fail "project.json keys from '$recipe' already set: $clash"
          jq -s '.[0] * .[1]' "$work/project.json" "$src/project.json" > "$work/project.json.next"
          mv "$work/project.json.next" "$work/project.json"
        else
          cp "$src/project.json" "$work/project.json"
        fi
        ;;
      .gitignore)
        cat "$src/.gitignore" >> "$work/.gitignore"
        ;;
      *)
        owner=$(awk -v f="$file" '{ r = $1; sub(/^[^ ]+ /, "") } $0 == f { print r; exit }' "$owners")
        [ -z "$owner" ] || fail "$file comes from both '$owner' and '$recipe'"
        echo "$recipe $file" >> "$owners"
        mkdir -p "$work/$(dirname "$file")"
        cp -p "$src/$file" "$work/$file"
        ;;
    esac
  done < <(files "$recipe")
done

mkdir -p "$work/.claude/skills"
cp -r "$HATCHERY/.claude/skills/karpathy-guidelines" "$work/.claude/skills/"
jq --arg version "$(cat "$HATCHERY/VERSION")" --argjson recipes "$(printf '%s\n' "${recipes[@]}" | jq -R . | jq -s .)" \
  'del(.hatchery) + {hatchery: {version: $version, recipes: $recipes}}' "$work/project.json" > "$work/project.json.next"
mv "$work/project.json.next" "$work/project.json"

mkdir -p "$dest"
existing=$(cd "$work" && find . -type f | sed 's|^\./||' | while IFS= read -r file; do [ ! -e "$dest/$file" ] || echo "$file"; done)
[ -z "$existing" ] || fail "already in $dest: $(echo "$existing" | tr '\n' ' ')"
cp -a "$work/." "$dest/"
echo "Composed ${recipes[*]} into $dest (hatchery $(cat "$HATCHERY/VERSION"))."
