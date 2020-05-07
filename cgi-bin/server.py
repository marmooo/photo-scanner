# Copyright (c) 2020 marmooo
# This source code is released under the MIT License.
# http://opensource.org/licenses/mit-license.php

#!/usr/bin/env python
import datetime, os, cgi, base64


basedir = os.environ['HOME'] + '/photo-scanner'
newdir  = datetime.datetime.now().strftime("%Y-%m-%d-%H-%S")
dir = basedir + '/' + newdir
os.makedirs(dir, exist_ok=True)

form = cgi.FieldStorage()
for i in range(len(form.keys())):
    binary = base64.b64decode(form.getvalue(str(i)))
    with open(dir + '/' + str(i) + '.jpg', 'wb') as f:
        f.write(binary)

print("Content-Type: text/html\n")
print("OK")

