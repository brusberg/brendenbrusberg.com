#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
build_dir=$(mktemp -d "${TMPDIR:-/tmp}/resume-build.XXXXXX")
trap 'rm -rf "$build_dir"' EXIT HUP INT TERM

cd "$repo_root/docs/resume"
tectonic --keep-logs --outdir "$build_dir" main.tex
if grep -Eq 'Missing character|Overfull \\|Underfull \\' "$build_dir/main.log"; then
  cat "$build_dir/main.log"
  printf '%s\n' 'Resolve the font/layout warnings before publishing the PDF.' >&2
  exit 1
fi
cp "$build_dir/main.pdf" "$repo_root/public/assets/brenden-brusberg-resume.pdf"
