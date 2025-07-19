import os
import zipfile
from datetime import datetime

# Create the main project structure
project_structure = {
    "client": {
        "src": {
            "components": {},
            "pages": {},
            "hooks": {},
            "utils": {}
        },
        "public": {}
    },
    "server": {
        "config": {},
        "controllers": {},
        "middleware": {},
        "routes": {},
        "sql": {}
    }
}

# Create directories
def create_directories(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)
        os.makedirs(path, exist_ok=True)
        if isinstance(content, dict):
            create_directories(path, content)

# Create base project directory
base_dir = "mobile_legends_recharge_platform"
os.makedirs(base_dir, exist_ok=True)
create_directories(base_dir, project_structure)

print("Project structure created successfully!")
print(f"Base directory: {base_dir}")