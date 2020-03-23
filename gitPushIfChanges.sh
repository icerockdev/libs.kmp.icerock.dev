#!/bin/sh

git config --local user.email "action@github.com"
git config --local user.name "GitHub Action"
git add .

if git diff-index --quiet HEAD --; then
    echo "no changes"
else
    echo "have changes"

    git commit -m "Update versions"
    remote_repo="https://${GITHUB_ACTOR}:$2}@github.com/${GITHUB_REPOSITORY}.git"
    git push "${remote_repo}" HEAD:master
fi