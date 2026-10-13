#!/bin/sh
python scripts/init_db.py
gunicorn backend.app:app --bind 0.0.0.0:5000
