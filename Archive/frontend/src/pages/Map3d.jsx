import {
  Suspense,
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import * as THREE from "three";
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Bounds,
  Html,
  useProgress,
  Environment,
  useBounds,
} from "@react-three/drei";
import {
  Box,
  Button,
  Stack,
  Typography,
  CircularProgress,
  TextField,
  SwipeableDrawer,
  Fab,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Tune as TuneIcon } from "@mui/icons-material";
import { getLabById } from "../lib/supabaseLabs";
import {
  getEquipmentByLabId,
  updateEquipmentPosition,
} from "../lib/supabaseItems";
import SearchBar from "../components/SearchBar.jsx";
import { can } from "../lib/permissions";
import { useAuth } from "../contexts/AuthContext";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html
      center
      style={{ fontFamily: "system-ui", fontSize: 35, pointerEvents: "none" }}
    >
      {Math.round(progress)}%
    </Html>
  );
}

function LabModel({ path, onLoaded }) {
  //useGLTF.preload(path);
  const { scene } = useGLTF(path);
  const { gl, camera } = useThree();
  const boundsApi = useBounds();
  const group = useState(() => new THREE.Group())[0];
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!scene || hasFittedRef.current) return;

    boundsApi.refresh(scene).clip().fit();
    hasFittedRef.current = true;
    onLoaded?.();
  }, [scene, boundsApi, onLoaded]);

  // Enable local clipping
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  // Clipping plane
  const ceilingPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), -1e6),
    [],
  );

  const bounds = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    return { minY: box.min.y, maxY: box.max.y };
  }, [scene]);

  const CLIP_OFFSET = 0.35;
  const CEILING_MARGIN = 0.1;

  useFrame(() => {
    if (camera.position.y >= bounds.maxY - CEILING_MARGIN) {
      ceilingPlane.constant = camera.position.y + CLIP_OFFSET;
    } else {
      ceilingPlane.constant = 1e6;
    }
  });

  // Apply backface culling
  useEffect(() => {
    group.clear();
    group.add(scene);
    scene.traverse((child) => {
      if (!child.isMesh) return;

      const mats = Array.isArray(child.material)
        ? child.material
        : [child.material];

      mats.forEach((mat) => {
        if (!mat) return;

        const name = (child.name + " " + mat.name).toLowerCase();

        // Keep glass/windows double-sided
        if (name.includes("window") || name.includes("glass")) {
          mat.side = THREE.DoubleSide;
        } else {
          // Backface culling
          mat.side = THREE.FrontSide;
        }

        // Attach clipping plane
        mat.clippingPlanes = [ceilingPlane];
        mat.needsUpdate = true;
      });
    });
  }, [scene, ceilingPlane, group]);

  return <primitive object={group} />;
}

function ItemLoadingOverlay({ isLabModelLoaded }) {
  const { progress, active } = useProgress();

  if (!isLabModelLoaded || !active || progress >= 100) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 16,
        right: 6,
        zIndex: 20,
        px: 1.5,
        py: 0.75,
        bgcolor: "rgba(249, 115, 22, 1)",
        color: "white",
        borderRadius: 1,
        fontSize: 20,
        pointerEvents: "none",
      }}
    >
      Loading items... {Math.round(progress)}%
    </Box>
  );
}

// Fallback component for failed models
function ModelFallback({ item, isSelected, onSelect }) {
  return (
    <group
      position={[item.x, item.y, item.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.qrCode || item.qr_code || item.id);
      }}
    >
      {/* Selection ring for fallback */}
      {isSelected && (
        <mesh
          position={[0, 0.35, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <ringGeometry args={[0.7, 0.75, 32]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      )}

      {/* Red error cube fallback */}
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#ff4444" wireframe />
      </mesh>

      {/* Error label */}
      <Html position={[0, 0.5, 0]} center>
        <div
          style={{
            background: "rgba(255, 68, 68, 0.9)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          ❌ Model Error
        </div>
      </Html>
    </group>
  );
}

// Component to render a single 3D item model
function ItemModel({
  item,
  isSelected,
  isHighlighted: _isHighlighted,
  onSelect,
}) {
  // Hooks must be called unconditionally at the top level
  const { scene } = useGLTF(item.modelPath, true, true, (loader) => {
    loader.manager.onError = (url) => {
      console.error(`[Map3D] ❌ Failed to load model for "${item.name}":`, {
        modelPath: url,
        itemId: item.id,
      });
    };
  });
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const scale = item.scale || 1;

  const ringData = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const radius = Math.max(size.x, size.z) * 0.6;

    return {
      center,
      radius,
      y: box.min.y + 0.2, // slightly above the bottom
    };
  }, [clonedScene]);

  return (
    <group
      position={[item.x, item.y, item.z]}
      rotation={[item.rotX || 0, item.rotY || 0, item.rotZ || 0]}
      scale={[scale, scale, scale]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.qrCode || item.qr_code || item.id);
      }}
    >
      {/* Selection ring */}
      {isSelected && (
        <mesh
          position={[ringData.center.x, ringData.y, ringData.center.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <ringGeometry args={[ringData.radius, ringData.radius + 0.04, 36]} />
          <meshBasicMaterial color="blue" />
        </mesh>
      )}

      {/* The model */}
      <primitive object={clonedScene} />
    </group>
  );
}

// Control Panels Component - reusable for both desktop and mobile
function ControlPanels({
  search,
  setSearch,
  filtered,
  getSelectionKey,
  setSelectedItemId,
  selectedItem,
  navigate,
  labId,
  step,
  setStep,
  selectedItemId,
  canMoveItems,
  nudge,
  nudgeScale,
  saving,
  dirty,
  saveSelectedPosition,
  resetSelectedToDb,
}) {
  return (
    <>
      {/* Search */}
      <Box>
        <SearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          onSearch={() => {}}
          placeholder="Search items in this lab..."
        />
        {search.trim() && (
          <Box
            sx={{
              mt: 1,
              maxHeight: 270,
              overflowY: "auto",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              boxShadow: 3,
            }}
          >
            {filtered.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ p: 1.5, color: "text.secondary" }}
              >
                No matches
              </Typography>
            ) : (
              filtered.slice(0, 12).map((item) => (
                <Box
                  key={item.id}
                  onClick={() => setSelectedItemId(getSelectionKey(item))}
                  sx={{
                    px: 1.5,
                    py: 1,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.name || `Item ${item.id}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    {item.category || item.tag || ""}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>

      {/* Selected Item Display */}
      <Box
        sx={{
          mt: 2,
          mb: 2,
          px: 1.5,
          py: 1,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          Current selected item
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {selectedItem
            ? selectedItem.name || `Item ${selectedItem.id}`
            : "None"}
        </Typography>

        <Button
          variant="contained"
          size="small"
          sx={{ mt: 1 }}
          disabled={!selectedItem}
          onClick={() => {
            const qr =
              selectedItem?.qrCode || selectedItem?.qr_code || selectedItem?.id;
            navigate(`/item/${qr}`, { state: { fromLabId: labId } });
          }}
        >
          View Item Details
        </Button>
      </Box>

      {/* Position Controls */}
      <Box
        sx={{
          mb: 2,
          px: 1.5,
          py: 1,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Stack spacing={1}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
              Position controls
            </Typography>

            <TextField
              label="Step"
              size="small"
              value={step}
              onChange={(e) => setStep(Number(e.target.value) || 0)}
              sx={{ width: 110 }}
              inputProps={{ inputMode: "decimal" }}
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selectedItemId || !canMoveItems}
              onClick={() => nudge("x", -1)}
            >
              X-
            </Button>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selectedItemId || !canMoveItems}
              onClick={() => nudge("x", 1)}
            >
              X+
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selectedItemId || !canMoveItems}
              onClick={() => nudge("y", -1)}
            >
              Y-
            </Button>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selectedItemId || !canMoveItems}
              onClick={() => nudge("y", 1)}
            >
              Y+
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selectedItemId || !canMoveItems}
              onClick={() => nudge("z", -1)}
            >
              Z-
            </Button>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selectedItemId || !canMoveItems}
              onClick={() => nudge("z", 1)}
            >
              Z+
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selectedItemId || !canMoveItems}
              onClick={() => nudgeScale(-1)}
            >
              Scale -
            </Button>
            <Button
              variant="outlined"
              fullWidth
              disabled={!selectedItemId || !canMoveItems}
              onClick={() => nudgeScale(1)}
            >
              Scale +
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              fullWidth
              disabled={!selectedItemId || !canMoveItems || saving || !dirty}
              onClick={saveSelectedPosition}
            >
              {saving ? "Saving..." : dirty ? "Save" : "Saved"}
            </Button>
            <Button
              variant="text"
              fullWidth
              disabled={!selectedItemId || !canMoveItems || !dirty}
              onClick={resetSelectedToDb}
            >
              Reset
            </Button>
          </Stack>

          {selectedItem && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              x={Number(selectedItem.x).toFixed(3)} y=
              {Number(selectedItem.y).toFixed(3)} z=
              {Number(selectedItem.z).toFixed(3)} scale=
              {Number(selectedItem.scale ?? 1).toFixed(3)}
            </Typography>
          )}
        </Stack>
      </Box>
    </>
  );
}

export default function Map3D() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const orbitControlsRef = useRef();
  const [searchParams] = useSearchParams();
  const itemQuery = searchParams.get("item");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isLabModelLoaded, setIsLabModelLoaded] = useState(false);
  const [lab, setLab] = useState(null);
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const role = user?.role;
  // Only admins can position 3D items in the lab view
  const canMoveItems = can(role, "items.position3d");
  const [step, setStep] = useState(0.1);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLabLoaded = useCallback(() => {
    setIsLabModelLoaded(true);
  }, []);

  const getSelectionKey = (item) => item?.qrCode || item?.qr_code || item?.id;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((it) => {
      const name = (it.name ?? "").toLowerCase();
      const tags = (it.tags ?? "").toLowerCase(); // Optional
      return name.includes(q) || tags.includes(q);
    });
  }, [items, search]);

  const highlightedIds = useMemo(
    () => new Set(filtered.map((i) => i.id)),
    [filtered],
  );

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return items.find((it) => getSelectionKey(it) === selectedItemId) ?? null;
  }, [items, selectedItemId]);

  const nudge = (axis, dir) => {
    if (!selectedItemId) return;

    setItems((prev) =>
      prev.map((it) =>
        getSelectionKey(it) === selectedItemId
          ? { ...it, [axis]: (Number(it[axis]) || 0) + dir * step }
          : it,
      ),
    );

    setDirty(true);
  };

  const nudgeScale = (dir) => {
    if (!selectedItemId) return;

    setItems((prev) =>
      prev.map((it) =>
        getSelectionKey(it) === selectedItemId
          ? {
              ...it,
              scale: Math.max(0.05, (Number(it.scale) || 1) + dir * step),
            }
          : it,
      ),
    );

    setDirty(true);
  };

  const resetSelectedToDb = () => {
    if (!selectedItemId) return;

    setItems((prev) =>
      prev.map((it) => {
        if (getSelectionKey(it) !== selectedItemId) return it;

        const original = originalItems.find(
          (orig) => getSelectionKey(orig) === selectedItemId,
        );

        return original
          ? {
              ...it,
              x: original.x,
              y: original.y,
              z: original.z,
              scale: original.scale ?? 1,
            }
          : it;
      }),
    );

    setDirty(false);
  };

  const saveSelectedPosition = async () => {
    // Find item using the same logic as selection (qrCode || qr_code || id)
    const it = items.find((x) => getSelectionKey(x) === selectedItemId);
    if (!it) {
      console.error("Could not find item to save:", selectedItemId);
      return;
    }

    console.log("Saving position for:", it.name, {
      id: it.id,
      x: it.x,
      y: it.y,
      z: it.z,
    });

    try {
      setSaving(true);
      await updateEquipmentPosition(it.id, {
        x: it.x,
        y: it.y,
        z: it.z,
        scale: it.scale ?? 1,
      });
      console.log("Position saved successfully!");
      setDirty(false);
    } catch (e) {
      console.error("Failed to save position:", e);
      alert(`Failed to save position: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsLabModelLoaded(false);

        // Fetch lab details
        const labData = await getLabById(labId);

        // Validate lab model path
        if (!labData.modelPath) {
          throw new Error(
            `Lab "${labData.name}" has no 3D model. Please upload a model in Labs Admin.`,
          );
        }

        // Check if lab model path is valid (must be Supabase Storage URL or local file that exists)
        const isValidUrl =
          labData.modelPath.startsWith("http://") ||
          labData.modelPath.startsWith("https://");

        if (!isValidUrl) {
          console.warn(
            `[Map3D] ⚠️ Lab "${labData.name}" uses local file path: ${labData.modelPath}`,
          );
          console.warn(
            `[Map3D] ⚠️ If the model fails to load, please re-upload via Labs Admin to use Supabase Storage`,
          );
        }

        setLab(labData);

        const itemsData = await getEquipmentByLabId(labData.id);

        // Filter to only show items that have valid 3D model URLs
        // (Supabase Storage URLs start with http:// or https://)
        const itemsReady = itemsData
          .filter((item) => {
            if (!item.modelPath) return false;
            // Only include models with valid URLs (from Supabase Storage)
            // Skip local file paths like /models/items/laptop.glb
            const isValidUrl =
              item.modelPath.startsWith("http://") ||
              item.modelPath.startsWith("https://");
            if (!isValidUrl) {
              console.warn(
                `Skipping ${item.name}: Invalid model path "${item.modelPath}". Please re-upload the model in ModelsAdmin.`,
              );
            }
            return isValidUrl;
          })
          .map((item, idx) => ({
            ...item,
            x: item.x ?? idx * 1.0,
            y: item.y ?? 0,
            z: item.z ?? 0,
          }));

        setItems(itemsReady);
        setOriginalItems(itemsReady);

        // ⚠️ DON'T preload all models at once - causes memory crash with many large files
        // Instead, let Suspense lazy-load models on-demand when they're rendered
        console.log(
          `[Map3D] Loaded ${itemsReady.length} items with 3D models (lazy loading enabled)`,
        );
      } catch (err) {
        console.error("Failed to load lab or items:", err);
        setError(err.message || "Failed to load lab. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [labId]);

  useEffect(() => {
    if (!itemQuery || items.length === 0) return;

    const matched = items.find(
      (it) =>
        String(it.id) === String(itemQuery) ||
        String(it.qrCode) === String(itemQuery) ||
        String(it.qr_code) === String(itemQuery),
    );

    if (matched) {
      setSelectedItemId(getSelectionKey(matched));
    }
  }, [itemQuery, items]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lab) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h2" color="error" gutterBottom>
          {error || "Lab not found"}
        </Typography>
        {error && error.includes("no 3D model") && (
          <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
            This lab needs a 3D model to be uploaded. Please go to the Labs
            Admin page to upload a .glb model file.
          </Typography>
        )}
        <Button
          sx={{ mt: 2 }}
          component={RouterLink}
          to="/map3d"
          variant="contained"
        >
          Back to Labs
        </Button>
        <Button
          sx={{ mt: 2, ml: 2 }}
          component={RouterLink}
          to="/admin/labs"
          variant="outlined"
        >
          Go to Labs Admin
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h1">{lab.name}</Typography>
          {items.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {items.length} 3D {items.length === 1 ? "item" : "items"} in this
              lab
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          component={RouterLink}
          to="/map3d"
        >
          Go Back To All Labs
        </Button>
      </Stack>

      {/* Camera View */}
      <div style={{ height: "80vh", width: "100%", position: "relative" }}>
        {/* Desktop: Absolute positioned panels */}
        {!isMobile && (
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              width: 360,
              zIndex: 10,
              pointerEvents: "auto",
            }}
          >
            <ControlPanels
              search={search}
              setSearch={setSearch}
              filtered={filtered}
              getSelectionKey={getSelectionKey}
              setSelectedItemId={setSelectedItemId}
              selectedItem={selectedItem}
              navigate={navigate}
              labId={labId}
              step={step}
              setStep={setStep}
              selectedItemId={selectedItemId}
              canMoveItems={canMoveItems}
              nudge={nudge}
              nudgeScale={nudgeScale}
              saving={saving}
              dirty={dirty}
              saveSelectedPosition={saveSelectedPosition}
              resetSelectedToDb={resetSelectedToDb}
            />
          </Box>
        )}

        {/* Mobile: FAB to toggle drawer */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="toggle controls"
            onClick={() => setDrawerOpen(true)}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            <TuneIcon />
          </Fab>
        )}

        {/* Mobile: SwipeableDrawer */}
        {isMobile && (
          <SwipeableDrawer
            anchor="bottom"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onOpen={() => setDrawerOpen(true)}
            disableSwipeToOpen={false}
            sx={{
              "& .MuiDrawer-paper": {
                height: "75vh",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                overflow: "hidden",
              },
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Drawer Handle */}
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 4,
                    bgcolor: "divider",
                    borderRadius: 2,
                  }}
                />
              </Box>

              {/* Drawer Content */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  px: 2,
                  py: 2,
                }}
              >
                <ControlPanels
                  search={search}
                  setSearch={setSearch}
                  filtered={filtered}
                  getSelectionKey={getSelectionKey}
                  setSelectedItemId={setSelectedItemId}
                  selectedItem={selectedItem}
                  navigate={navigate}
                  labId={labId}
                  step={step}
                  setStep={setStep}
                  selectedItemId={selectedItemId}
                  canMoveItems={canMoveItems}
                  nudge={nudge}
                  saving={saving}
                  dirty={dirty}
                  saveSelectedPosition={saveSelectedPosition}
                  resetSelectedToDb={resetSelectedToDb}
                />
              </Box>
            </Box>
          </SwipeableDrawer>
        )}
        <ItemLoadingOverlay isLabModelLoaded={isLabModelLoaded} />
        <Canvas
          camera={{ position: [5, 5, 5], fov: 45 }}
          onPointerMissed={() => setSelectedItemId(null)}
        >
          <ambientLight />
          <directionalLight position={[5, 5, 5]} intensity={0.9} />

          <Bounds margin={1}>
            {/* LAB loads first with visible loader */}
            {lab.modelPath &&
              (lab.modelPath.startsWith("http://") ||
                lab.modelPath.startsWith("https://") ||
                lab.modelPath.startsWith("/models/")) && (
                <Suspense fallback={<Loader />}>
                  <LabModel
                    key={lab.modelPath}
                    path={lab.modelPath}
                    onLoaded={handleLabLoaded}
                  />
                </Suspense>
              )}

            {/* ITEMS only start after lab is loaded */}
            {isLabModelLoaded &&
              items.map((item) => (
                <Suspense key={item.id} fallback={null}>
                  <ItemModel
                    item={item}
                    itemKey={getSelectionKey(item)}
                    isSelected={selectedItemId === getSelectionKey(item)}
                    isHighlighted={highlightedIds.has(item.id)}
                    onSelect={setSelectedItemId}
                  />
                </Suspense>
              ))}
          </Bounds>

          <Environment preset="city" />

          <OrbitControls
            ref={orbitControlsRef}
            makeDefault
            enablePan
            enableZoom
            enableRotate
          />
        </Canvas>
      </div>
    </Box>
  );
}
