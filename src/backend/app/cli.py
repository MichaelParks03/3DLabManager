import argparse
import asyncio
import json
import sys
from getpass import getpass
from pathlib import Path

from pydantic import ValidationError

from app.core.db import SessionLocal
from app.core.errors import AppError
from app.features.auth import service
from app.features.auth.schemas import AdminCreate
from app.main import app

OPENAPI_PATH = Path(__file__).resolve().parent.parent / "openapi.json"


async def create_admin(email: str, name: str, password: str) -> None:
    async with SessionLocal() as db:
        admin = await service.create_admin(db, email=email, name=name, password=password)
    print(f"Created admin {admin.email}")


def run_create_admin(args: argparse.Namespace) -> None:
    password = getpass("Password: ")
    if password != getpass("Confirm password: "):
        sys.exit("Passwords do not match")
    try:
        data = AdminCreate(email=args.email, name=args.name, password=password)
        asyncio.run(create_admin(data.email, data.name, data.password))
    except ValidationError as exc:
        sys.exit("; ".join(err["msg"] for err in exc.errors()))
    except AppError as exc:
        sys.exit(exc.message)


def run_export_openapi(_: argparse.Namespace) -> None:
    contract = json.dumps(app.openapi(), indent=2) + "\n"
    OPENAPI_PATH.write_text(contract, encoding="utf-8", newline="\n")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("create-admin", help="create an admin account")
    create.add_argument("--email", required=True)
    create.add_argument("--name", required=True)
    create.set_defaults(run=run_create_admin)
    export = commands.add_parser("export-openapi", help="write openapi.json")
    export.set_defaults(run=run_export_openapi)
    args = parser.parse_args(argv)
    args.run(args)


if __name__ == "__main__":
    main()
