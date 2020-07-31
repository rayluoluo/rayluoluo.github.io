#!/bin/bash
usage(){
  echo -e "Error - cmd usage:\n ./$0 [start|stop]"
}

getpid(){
  pid=`ps aux | grep jekyll | grep -v grep | awk '{print $2}'`
  echo $pid > jekyll.pid
}

checkstatus(){
  getpid
  ! [ -z $pid ] && echo "jekyll is running. pid:$pid" && exit 1
}

[ $# != 1 ] && usage && exit 1;

case $1 in
  start)
    checkstatus
    nohup bundle exec jekyll serve --drafts &
    getpid
    echo "cmd: \`bundle exec jekyll serve --drafts\` run in backgroud. pid:$pid."
    echo -e "now you can goto \033[32mhttp://127.0.0.1:4000\033[0m"
    ;;
  stop)
    getpid
    if [ -z $pid ]; then
      echo "jekyll is not running."
    else
      echo "pid: $pid" && kill -9 $pid && echo "jekyll is stopped."
    fi
    ;;
  *)
    usage
    ;;
esac
