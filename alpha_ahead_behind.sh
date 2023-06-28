git branch -l | tail +2 | sed -E 's/^ *(.*)/echo -n \1 ": \n   "; git rev-list --left-right --count alpha...\1/'  | sh
