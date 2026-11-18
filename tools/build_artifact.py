"""Make a publishable page: strip the document wrapper (the Artifact host adds its own
<!doctype>/<head>/<body>) and keep the head's title, fonts and styles plus the body.
Usage: python3 tools/build_artifact.py [src.html] [dist/out.html]   (default: index.html -> dist/index.html)
The option pages are published unchanged."""
import re, os, sys
src = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
out = sys.argv[2] if len(sys.argv) > 2 else 'dist/index.html'
s = open(src).read()
head = re.search(r'<head>(.*?)</head>', s, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', '', head)
body = re.search(r'<body>(.*)</body>', s, re.S).group(1)
os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
open(out, 'w').write(head.strip() + '\n' + body.strip() + '\n')
print(out, len(head) + len(body))
