# Add parent directory to path to access models.py
import sys
import os

# Add the parent directory (where models.py is located) to the Python path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
