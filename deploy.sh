#!/bin/bash
# CipherChat — One-command deploy scripts
# Run from /Users/priyanshupandey/Desktop/Temp/cipherchat

echo "🔐 CipherChat Deploy Helper"
echo "============================"
echo ""
echo "Choose your platform:"
echo "  1) Vercel  (vercel.com  — free, fastest)"
echo "  2) Netlify (netlify.com — free, easy)"  
echo "  3) Surge   (surge.sh    — free, instant)"
echo "  4) GitHub Pages (github.com — free)"
echo ""
read -p "Enter 1-4: " choice

case $choice in
  1)
    echo "→ Deploying to Vercel..."
    npx vercel dist --prod
    ;;
  2)
    echo "→ Deploying to Netlify..."
    npx netlify deploy --dir=dist --prod
    ;;
  3)
    echo "→ Deploying to Surge..."
    surge dist cipherchat-app.surge.sh
    ;;
  4)
    echo "→ Deploying to GitHub Pages..."
    cd /Users/priyanshupandey/Desktop/Temp/cipherchat
    git init
    git add -A
    git commit -m "Deploy CipherChat"
    echo "Go to github.com/new → create repo 'cipherchat'"
    read -p "Enter your GitHub repo URL (e.g. https://github.com/priyanshu-18/cipherchat): " repo
    git remote add origin $repo
    git push -u origin main
    npx gh-pages -d dist
    echo "✅ Visit: https://priyanshu-18.github.io/cipherchat"
    ;;
esac
