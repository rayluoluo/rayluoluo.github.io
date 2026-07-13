#!/bin/bash
usage(){
  echo -e "Error - cmd usage:\n ./$0 TITLE [category] [TAGS1]..[TAGN]"
  exit 1
}

[ $# -lt 1 ] && echo -e "Error - Title is not specified." && usage

title="$1"
category="$2"

day=`date '+%Y-%m-%d'`
filename="$day-$1.markdown"

[ -e ./_drafts/"$filename" ] && read -p "$filename already exists. remove[y/Y] or not[n/N]?" y_or_n && [ "${y_or_n}" != "y" ] && [ "${y_or_n}" != "Y" ] && echo "DO NOT create a new draft file. EXIT." && exit 1

tags_section=""
if [ $# -gt 2 ]; then
  shift 2
  tags_section="tags:"
  for tag in "$@"; do
    tags_section="$tags_section $tag"
  done
fi

cat <<EOF >./_drafts/"$filename"
---
layout: post
title:  "$title"
category: "$category"
$tags_section
---
EOF

cd ./_drafts
readlink -f "$filename"
