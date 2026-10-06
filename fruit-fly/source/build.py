"""Build a dependency-free portable HTML and a classroom handoff archive."""
from pathlib import Path
import zipfile
import base64

root = Path(__file__).resolve().parent
output = root / 'dist'
output.mkdir(exist_ok=True)
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + (root / 'styles.css').read_text() + '\n</style>')
for name in ('genetics.js', 'app.js'):
    html = html.replace(f'<script src="{name}"></script>', '<script>\n' + (root / name).read_text() + '\n</script>')
for image in ('测交1假说2.jpg', '测交1假说3.jpg', '测交2假说2.jpg', '测交2假说3.jpg'):
    path = root / '图片' / image
    encoded = base64.b64encode(path.read_bytes()).decode('ascii')
    html = html.replace(f'图片/{image}', f'data:image/jpeg;base64,{encoded}')
portable = output / '果蝇实验室.html'
portable.write_text(html)
with zipfile.ZipFile(output / '果蝇实验室-交付.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(portable, portable.name)
    archive.write(root / 'README.md', '使用说明.md')
print('Built portable HTML and handoff ZIP in dist/.')
