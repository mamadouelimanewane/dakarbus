with open('src/components/MapView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Ajouter background clair au MapContainer
content = content.replace(
    'style={{ width: \'100%\', height: \'100%\' }}',
    'style={{ width: \'100%\', height: \'100%\', background: \'#f0f4f8\' }}'
)

# 2. Changer les backgrounds des popups de sombre vers clair
content = content.replace("background: '#1e293b'", "background: '#ffffff'")

# 3. Changer les couleurs de texte pour fond clair
content = content.replace("color: '#f1f5f9'", "color: '#1e293b'")
content = content.replace("color: '#94a3b8'", "color: '#64748b'")
content = content.replace("color: '#34d399'", "color: '#059669'")
content = content.replace("color: '#f87171'", "color: '#dc2626'")

with open('src/components/MapView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('MapView.tsx corrige - fonds clairs')
