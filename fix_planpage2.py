# Lire PlanPage.tsx
with open('src/pages/PlanPage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Trouver et modifier les lignes
new_lines = []
for i, line in enumerate(lines):
    # Ajouter clearRoute dans l'import
    if "import { setActiveTab } from '@/store/store';" in line:
        new_lines.append("import { setActiveTab, clearRoute } from '@/store/store';\n")
        continue
    
    # Ajouter useAppSelector dans l'import des hooks
    if "import { useAppDispatch } from '@/store/hooks';" in line:
        new_lines.append("import { useAppDispatch, useAppSelector } from '@/store/hooks';\n")
        continue
    
    # Ajouter la déclaration de hasRoute après useAppDispatch
    if 'const dispatch = useAppDispatch();' in line:
        new_lines.append(line)
        new_lines.append("  const { route } = useAppSelector(s => s.mobility);\n")
        new_lines.append("  const hasRoute = !!(route.origin && route.destination);\n")
        continue
    
    new_lines.append(line)

# Écrire le fichier modifié
with open('src/pages/PlanPage.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('PlanPage.tsx corrige avec succes')