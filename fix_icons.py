import os
import re

# Patterns intelligents : ne remplacer que dans le JSX (entre > et < ou dans strings)
# On utilise un pattern qui ne matche PAS les acces aux proprietes comme DRIVER_PINS[pin]
REPLACEMENTS = {
    r'(?<![a-zA-Z0-9_])\[BUS\](?![a-zA-Z0-9_])': '{Icons.bus()}',
    r'(?<![a-zA-Z0-9_])\[CAR\](?![a-zA-Z0-9_])': '{Icons.car()}',
    r'(?<![a-zA-Z0-9_])\[BRT\](?![a-zA-Z0-9_])': '{Icons.brt()}',
    r'(?<![a-zA-Z0-9_])\[TRAIN\](?![a-zA-Z0-9_])': '{Icons.train()}',
    r'(?<![a-zA-Z0-9_])\[MAP\](?![a-zA-Z0-9_])': '{Icons.map()}',
    r'(?<![a-zA-Z0-9_])\[PIN\](?![a-zA-Z0-9_])': '{Icons.pin()}',
    r'(?<![a-zA-Z0-9_])\[WARN\](?![a-zA-Z0-9_])': '{Icons.warn()}',
    r'(?<![a-zA-Z0-9_])\[TICKET\](?![a-zA-Z0-9_])': '{Icons.ticket()}',
    r'(?<![a-zA-Z0-9_])\[USER\](?![a-zA-Z0-9_])': '{Icons.user()}',
    r'(?<![a-zA-Z0-9_])\[CARD\](?![a-zA-Z0-9_])': '{Icons.card()}',
    r'(?<![a-zA-Z0-9_])\[SEARCH\](?![a-zA-Z0-9_])': '{Icons.search()}',
    r'(?<![a-zA-Z0-9_])\[ROUTE\](?![a-zA-Z0-9_])': '{Icons.route()}',
}

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        modified = False
        
        for pattern, replacement in REPLACEMENTS.items():
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                content = new_content
                modified = True
        
        if modified:
            # Ajouter l'import Icons si pas present
            if "import Icons from" not in content:
                content = "import Icons from '@/components/Icons';\n" + content
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'  OK: {os.path.basename(filepath)}')
            return True
        return False
    except Exception as e:
        return False

# Creer Icons.tsx
icons_content = '''import React from 'react';
import { FaBus, FaShuttleVan, FaTrain, FaMapMarkedAlt, FaMapMarkerAlt, FaExclamationTriangle, FaTicketAlt, FaUser, FaCreditCard, FaSearch, FaRoute } from 'react-icons/fa';

export const Icons = {
  bus: () => <FaBus className="inline-block" />,
  car: () => <FaShuttleVan className="inline-block" />,
  brt: () => <FaBus className="inline-block" />,
  train: () => <FaTrain className="inline-block" />,
  map: () => <FaMapMarkedAlt className="inline-block" />,
  pin: () => <FaMapMarkerAlt className="inline-block" />,
  warn: () => <FaExclamationTriangle className="inline-block" />,
  ticket: () => <FaTicketAlt className="inline-block" />,
  user: () => <FaUser className="inline-block" />,
  card: () => <FaCreditCard className="inline-block" />,
  search: () => <FaSearch className="inline-block" />,
  route: () => <FaRoute className="inline-block" />,
};

export default Icons;
'''

os.makedirs('src/components', exist_ok=True)
with open('src/components/Icons.tsx', 'w', encoding='utf-8') as f:
    f.write(icons_content)
print('  OK: Icons.tsx cree')

# Traiter tous les fichiers TSX/TS
count = 0
for root, dirs, files in os.walk('src'):
    if 'node_modules' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            if process_file(filepath):
                count += 1

print(f'\n{count} fichiers modifies')