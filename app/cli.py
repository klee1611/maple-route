"""Ask a question from the terminal: uv run python -m app.cli "question" """

import asyncio
import sys

from app.baseline import answer


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit('usage: python -m app.cli "question"')
    print(asyncio.run(answer(" ".join(sys.argv[1:]))))


if __name__ == "__main__":
    main()
