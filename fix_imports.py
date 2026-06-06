# Lire PlanPage.tsx
with open('src/pages/PlanPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Supprimer les doublons d'imports
lines = content.split('\n')
seen_imports = set()
new_lines = []

for line in lines:
    # Vérifier si c'est une ligne d'import
    if line.strip().startswith('import '):
        # Extraire les noms importés
        if 'useAppSelector' in line:
            if 'useAppSelector' in seen_imports:
                # Déjà vu, supprimer cette ligne
                continue
            else:
                seen_imports.add('useAppSelector')
        
        if 'useAppDispatch' in line:
            if 'useAppDispatch' in seen_imports:
                continue
            else:
                seen_imports.add('useAppDispatch')
    
    new_lines.append(line)

content = '\n'.join(new_lines)

# Écrire le fichier corrigé
with open('src/pages/PlanPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('PlanPage.tsx corrige - doublons supprimes')