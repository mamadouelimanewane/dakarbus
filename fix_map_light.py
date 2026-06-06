with open('src/components/MapView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remplacer TOUTES les URLs de tuiles sombres par des tuiles claires
content = content.replace(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
)

# S'assurer que darkMode est desactive
content = content.replace("darkMode: 'dark'", '')
content = content.replace('darkMode: true', '')
content = content.replace('darkMode: false', '')

with open('src/components/MapView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('MapView.tsx corrige - tuiles claires forcees')
