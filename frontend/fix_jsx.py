import re

files = [
    r'd:\Token_Comparision\Binjwa-ai-cost-platform\frontend\src\pages\SuperAdminPricing.jsx',
    r'd:\Token_Comparision\Binjwa-ai-cost-platform\frontend\src\pages\EmployeeDashboard.jsx',
    r'd:\Token_Comparision\Binjwa-ai-cost-platform\frontend\src\pages\UsageLogs.jsx',
    r'd:\Token_Comparision\Binjwa-ai-cost-platform\frontend\src\pages\Recommendations.jsx'
]

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The exact string is literally: .toFixed(X).replace(\'.toFixed(\'+ X +\')\', \'\')
    # We want to match: \.toFixed\(\d+\)\.replace\(\\'\.toFixed\(\\'\+\s*\d+\s*\+\\'\)\\',\s*\\'\\'\)
    # Using python raw strings for regex, we can match it:
    
    # We want to find `.toFixed(X)` followed by `.replace(...)`
    # Let's use a simpler regex that matches from `.toFixed` up to the closing `)` of `.replace`
    # Since we know it's a specific pattern, we can just match:
    # \.toFixed\(\d+\)\.replace\([^)]+\)\', \'\'\)
    # Wait, the closing parentheses is part of replace().
    
    # Easier: Just find ALL occurrences of `.replace(\'.toFixed(` and remove the whole chunk.
    # A chunk looks like: .toFixed(4).replace(\'.toFixed(\'+ 4 +\')\', \'\')
    
    # Let's replace using regex:
    pattern = re.compile(r'\.toFixed\(\d+\)\.replace\(\\\'\.toFixed\(\\\'\+\s*\d+\s*\+\\\'\\\'\),?\s*\\\'\\\'\)')
    # Actually, let's just do a string replace for the possible values (0 to 5)
    for i in range(10):
        bad_str = f".toFixed({i}).replace(\\'.toFixed(\\'+ {i} +\\')\\', \\'\\')"
        content = content.replace(bad_str, "")
        bad_str2 = f".toFixed({i}).replace('\\.toFixed(\\'+ {i} +\\')\\', \\'\\')"
        content = content.replace(bad_str2, "")
        
    # Let's try a regex that matches the exact string without shell escaping issues
    content = re.sub(r'\.toFixed\(\d+\)\.replace\(\\\'[^)]+\)', '', content)
    
    # Let's just remove anything matching \.toFixed\(\d+\)\.replace\(.*?\'\'\)
    content = re.sub(r'\.toFixed\(\d+\)\.replace\(.*?\'\'\)', '', content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done fixing JSX files")
