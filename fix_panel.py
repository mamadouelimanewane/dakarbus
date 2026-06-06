# Lire RoutePanel.tsx
with open('src/components/RoutePanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Ajouter l'import de RouteMap
if 'import RouteMap' not in content:
    content = content.replace(
        "import SearchBar from './SearchBar';",
        "import SearchBar from './SearchBar';\nimport RouteMap from './RouteMap';"
    )

# 2. Ajouter l'etat showMap
if 'showMap' not in content:
    content = content.replace(
        'const [nearestInfo, setNearestInfo]',
        'const [showMap, setShowMap] = useState(false);\n  const [nearestInfo, setNearestInfo]'
    )

# 3. Activer la carte quand on calcule
if 'setShowMap(true)' not in content:
    content = content.replace(
        'if (results[0]) dispatch(recordTrip',
        'setShowMap(true);\n    if (results[0]) dispatch(recordTrip'
    )

# 4. MODIFICATION MINIMALE : Ajouter RouteMap juste AVANT le return principal
# On cherche "return (" et on insere RouteMap juste apres
if '<RouteMap' not in content:
    # Trouver le return de la fonction principale RoutePanel
    # On cherche le pattern specifique du return de RoutePanel
    content = content.replace(
        'return (\n    <div className="p-4 space-y-3">',
        'return (\n    <div className="flex flex-col h-full">\n      <RouteMap show={showMap && options.length > 0} onClose={() => setShowMap(false)} />\n      <div className="flex-1 overflow-y-auto p-4 space-y-3">'
    )
    
    # Maintenant il faut fermer la div wrapper. On cherche la derniere fermeture
    # La structure originale finit par </div>\n  );\n}
    # On doit ajouter </div> avant le );
    
    # Trouver la fin exacte de la fonction RoutePanel
    # Le pattern original est :
    #     </div>
    #   );
    # }
    # On doit le remplacer par :
    #     </div>
    #     </div>
    #   );
    # }
    
    # On cherche la derniere occurrence de ce pattern
    lines = content.split('\n')
    
    # Trouver la ligne qui contient exactement "  );" apres un "</div>"
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip() == ');' and i > 0 and '</div>' in lines[i-1]:
            # Inserer </div> avant cette ligne
            indent = '    '
            lines.insert(i, indent + '</div>')
            break
    
    content = '\n'.join(lines)

# 5. Fermer la carte quand on efface
if 'setShowMap(false)' not in content:
    content = content.replace(
        'setNearestInfo(null); }',
        'setNearestInfo(null); setShowMap(false); }'
    )

# Ecrire le fichier
with open('src/components/RoutePanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('RoutePanel.tsx modifie avec succes')