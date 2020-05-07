rm -rf docs
cp -r photo-scanner docs
minify --all --recursive photo-scanner --output docs

