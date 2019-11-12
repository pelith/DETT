mkdir -p DETT_Cache/gh-pages/
cp dist/cache.html DETT_Cache/gh-pages/cache.html
npm run cache
cp -R DETT_Cache/dist/s dist/
cp -R DETT_Cache/dist/p dist/
cp -R DETT_Cache/dist/c dist/
