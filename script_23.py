# Create a comprehensive file listing to show the user what was generated
import os

def list_files_recursively(directory, prefix=""):
    files_list = []
    try:
        items = sorted(os.listdir(directory))
        for item in items:
            if item.startswith('.') and item not in ['.env.example', '.gitignore', '.github']:
                continue
            
            item_path = os.path.join(directory, item)
            if os.path.isdir(item_path):
                files_list.append(f"{prefix}📁 {item}/")
                if item != 'node_modules':  # Skip node_modules to avoid clutter
                    files_list.extend(list_files_recursively(item_path, prefix + "  "))
            else:
                # Get file size
                try:
                    size = os.path.getsize(item_path)
                    if size < 1024:
                        size_str = f"{size}B"
                    elif size < 1024 * 1024:
                        size_str = f"{size//1024}KB"
                    else:
                        size_str = f"{size//(1024*1024)}MB"
                    
                    files_list.append(f"{prefix}📄 {item} ({size_str})")
                except:
                    files_list.append(f"{prefix}📄 {item}")
    except PermissionError:
        files_list.append(f"{prefix}❌ Permission denied")
    
    return files_list

# Generate the file listing
print("🎉 COMPLETE MOBILE LEGENDS RECHARGE PLATFORM GENERATED!")
print("=" * 70)
print()

file_listing = list_files_recursively(base_dir)
for file_line in file_listing:
    print(file_line)

print()
print("=" * 70)
print("📊 PROJECT STATISTICS:")
print(f"📁 Total Directories: {len([f for f in file_listing if '📁' in f])}")
print(f"📄 Total Files: {len([f for f in file_listing if '📄' in f])}")
print()

# Count lines of code
total_lines = 0
code_files = 0

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.css', '.sql', '.md', '.json', '.yml', '.yaml')):
            try:
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = len(f.readlines())
                    total_lines += lines
                    code_files += 1
            except:
                pass

print(f"💻 Code Files: {code_files}")
print(f"📝 Total Lines of Code: {total_lines:,}")
print()
print("🚀 READY FOR DEPLOYMENT!")
print("Follow the README.md instructions to set up and deploy your platform.")