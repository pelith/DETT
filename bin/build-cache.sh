mkdir -p LOOM_BBS_Cache/gh-pages/
cp dist/cache.html LOOM_BBS_Cache/gh-pages/cache.html
npm run cache
cp -R LOOM_BBS_Cache/dist/s dist/
cp -R LOOM_BBS_Cache/dist/p dist/
cp -R LOOM_BBS_Cache/dist/c dist/
