rm -rf docs
cp -r src docs
minify --all --recursive src --output docs

