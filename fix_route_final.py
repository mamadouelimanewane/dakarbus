import re

with open('src/components/RoutePanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ajouter calculatePrice si pas present
if 'calculatePrice' not in content:
    calc_func = '''
// Calculer le prix selon la distance (150-500 FCFA)
function calculatePrice(distance: number): number {
  if (distance < 2) return 150;
  if (distance < 5) return 200;
  if (distance < 10) return 300;
  return 500;
}

'''
    content = re.sub(
        r"(import.*?from.*?';\n)+",
        lambda m: m.group(0) + calc_func,
        content,
        count=1
    )

# Ajouter l'affichage du numero de ligne dans OptionCard
if 'LIGNE' not in content:
    pattern = r'(\{option\.label\}\s*</span>)'
    replacement = r'''\1
          <span className="text-xs font-black px-2 py-1 rounded-md text-white"
            style={{ background: option.primaryLineColor }}>
            LIGNE {option.primaryLineName}
          </span>'''
    
    content = re.sub(pattern, replacement, content)

with open('src/components/RoutePanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('RoutePanel.tsx modifie')
