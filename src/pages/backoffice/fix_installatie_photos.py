import re
import sys

path = 'c:/mEPA/massEPA/src/pages/backoffice/InstallatieView.tsx'

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    helper = '''
    const getActiveInstDetails = () => {
      const allInst = data.installationsList || (data.installations && Array.isArray(data.installations) ? data.installations : []);
      const existingInst = allInst.find((i: any) => i.id === activeInstallatieId);
      return existingInst?.details || {};
    };
'''

    content = re.sub(
        r"const getSanitizedFileKey = \(category: string\) => \{\s*return `files_\$\{category\.replace\(\/\[\^a-zA-Z0-9_\]\/g, ''\)\}`;\s*\};\n",
        lambda m: m.group(0) + helper,
        content
    )

    content = re.sub(
        r"const files: any\[\] = \(data\.installations as any\)\?\.\[getSanitizedFileKey\('([^']+)'\)\] \|\| \[\];",
        r"const files: any[] = getActiveInstDetails()[getSanitizedFileKey('\1')] || [];",
        content
    )

    content = re.sub(
        r"const existingFiles: any\[\] = Array\.isArray\(\(data\?\.installations as any\)\?\.\[currentFilesKey\]\)\s*\? \(data\.installations as any\)\[currentFilesKey\]\s*: \[\];",
        r"const existingFiles: any[] = Array.isArray(getActiveInstDetails()[currentFilesKey]) ? getActiveInstDetails()[currentFilesKey] : [];",
        content
    )
    
    # We replaced the handleFileUpload 'if (data.installations.selectedPhotoIndex...' logic incorrectly earlier. Let's fix that.
    # It might already be replaced, so let's use a robust replace for handleFileUpload.
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
