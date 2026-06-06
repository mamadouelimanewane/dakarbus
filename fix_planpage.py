# Lire PlanPage.tsx
with open('src/pages/PlanPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Ajouter les imports
if 'import RouteMap' not in content:
    content = content.replace(
        "import RoutePanel from '@/components/RoutePanel';",
        "import RoutePanel from '@/components/RoutePanel';\nimport RouteMap from '@/components/RouteMap';\nimport { useAppSelector } from '@/store/hooks';"
    )

# 2. Ajouter le hook useAppSelector dans la fonction
if 'useAppSelector' not in content:
    content = content.replace(
        'const dispatch = useAppDispatch();',
        'const dispatch = useAppDispatch();\n  const { route } = useAppSelector(s => s.mobility);\n  const hasRoute = !!(route.origin && route.destination);'
    )

# 3. Modifier le return pour ajouter RouteMap
if '<RouteMap' not in content:
    content = content.replace(
        'return (\n    <div className="overflow-y-auto pb-6">',
        'return (\n    <div className="flex flex-col h-full">\n      <RouteMap show={hasRoute} onClose={() => dispatch(clearRoute())} />\n      <div className="flex-1 overflow-y-auto pb-6">'
    )
    
    # Fermer la div wrapper
    lines = content.split('\n')
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip() == ');' and i > 0 and '</div>' in lines[i-1]:
            indent = '    '
            lines.insert(i, indent + '</div>')
            break
    content = '\n'.join(lines)

# 4. Ajouter l'import de clearRoute si pas present
if 'clearRoute' not in content:
    content = content.replace(
        "import { setActiveTab } from '@/store/store';",
        "import { setActiveTab, clearRoute } from '@/store/store';"
    )

# Ecrire
with open('src/pages/PlanPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('PlanPage.tsx modifie avec succes')