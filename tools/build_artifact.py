"""Make dist/index.html: the hub page without its document wrapper, for publishing as an Artifact
(the Artifact host adds its own <!doctype>/<head>/<body>). The option pages are published unchanged."""
import re, os
s = open('index.html').read()
head = re.search(r'<head>(.*?)</head>', s, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', '', head)
body = re.search(r'<body>(.*)</body>', s, re.S).group(1)
os.makedirs('dist', exist_ok=True)
open('dist/index.html', 'w').write(head.strip() + '\n' + body.strip() + '\n')
print('dist/index.html', len(head) + len(body))
