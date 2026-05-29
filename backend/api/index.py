import os
import sys

# Insert root directory into sys.path to allow imports from "app"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
