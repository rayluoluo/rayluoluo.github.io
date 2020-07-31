#!/bin/bash
usage(){
  echo -e "Error - cmd usage:\n ./$0 TITIL [TAGS]"
  exit 1
}

[ $# -lt 1 ] && echo -e "Error - Title is not specified."&& usage 

title=$1

day=`date '+%Y-%m-%d'`
filename=$day'-'$1'.markdown'
#echo $filename

cat <<EOF >./_drafts/$filename
#todo
EOF

cd ./_drafts
ls $filename
