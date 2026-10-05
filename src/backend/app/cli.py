import argparse
import asyncio
import sys
from getpass import getpass

from pydantic import ValidationError

from app.core.db import SessionLocal
from app.core.errors import AppError
from app.features.auth import service
from app.features.auth.schemas import AdminCreate


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


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("create-admin", help="create an admin account")
    create.add_argument("--email", required=True)
    create.add_argument("--name", required=True)
    create.set_defaults(run=run_create_admin)
    args = parser.parse_args(argv)
    args.run(args)


if __name__ == "__main__":
    main()
