# adapters-bandit

Bandit adapter for Python SAST. It runs `bandit -r <targetPath> -f json`, normalizes findings, and includes bilingual remediation coaching. Projects are detected from `requirements.txt`, `pyproject.toml`, `setup.py`, or `Pipfile`.
