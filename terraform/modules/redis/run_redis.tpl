#!/bin/bash
set -euo pipefail # https://unix.stackexchange.com/questions/597500/what-is-the-meaning-of-set-e-o-pipefail

# compute engine will only run core utils & redis, bind on 0.0.0.0 to expose to vpc accessor
docker run -d -p 0.0.0.0:6379:6379 -d redis:6
