# feature model modules are imported here so Alembic sees their tables
from app.features.auth import models as auth_models  # noqa: F401
from app.features.inventory import models as inventory_models  # noqa: F401
