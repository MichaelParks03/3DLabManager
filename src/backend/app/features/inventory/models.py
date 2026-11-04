from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, TimestampMixin


class Computer(TimestampMixin, Base):
    __tablename__ = "computers"

    asset_tag: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    cpu: Mapped[str | None] = mapped_column(String(100))
    ram: Mapped[str | None] = mapped_column(String(50))
    gfx_card: Mapped[str | None] = mapped_column(String(100))
    is_windows_11_ready: Mapped[bool] = mapped_column(Boolean, server_default="false")
    storage_1: Mapped[str | None] = mapped_column(String(100))
    storage_2: Mapped[str | None] = mapped_column(String(100))
    storage_3: Mapped[str | None] = mapped_column(String(100))
    location: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(String(255))
    windows_pw: Mapped[str | None] = mapped_column(String(100))
    linux_pw: Mapped[str | None] = mapped_column(String(100))


class Device(TimestampMixin, Base):
    __tablename__ = "devices"

    device_type: Mapped[str] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100))
    serial_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    imei: Mapped[str | None] = mapped_column(String(50), unique=True)
    asset_tag: Mapped[str | None] = mapped_column(String(50), unique=True)
    account_affiliated: Mapped[str | None] = mapped_column(String(100))
    checked_out_to: Mapped[str | None] = mapped_column(String(100))


class PowerSupplyScope(TimestampMixin, Base):
    __tablename__ = "power_supplies"

    product_type: Mapped[str] = mapped_column(String(100))
    brand: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100))
    serial_number: Mapped[str | None] = mapped_column(String(100), unique=True)


class QuestHeadset(TimestampMixin, Base):
    __tablename__ = "quest_headsets"

    model: Mapped[str | None] = mapped_column(String(100))
    serial_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    left_nunchuck: Mapped[str | None] = mapped_column(String(100))
    right_nunchuck: Mapped[str | None] = mapped_column(String(100))
    common_name: Mapped[str | None] = mapped_column(String(100))
    pairing_code: Mapped[str | None] = mapped_column(String(50))
    comments: Mapped[str | None] = mapped_column(String(255))


class HeadsetCheckout(TimestampMixin, Base):
    __tablename__ = "headset_checkouts"

    student_name: Mapped[str] = mapped_column(String(100), index=True)
    professor: Mapped[str | None] = mapped_column(String(100))
    section: Mapped[str | None] = mapped_column(String(50))
    team_name: Mapped[str | None] = mapped_column(String(100))
    is_vr_ar: Mapped[bool] = mapped_column(Boolean, server_default="false")
    headset: Mapped[str | None] = mapped_column(String(100))
    check_out_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    check_in_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
