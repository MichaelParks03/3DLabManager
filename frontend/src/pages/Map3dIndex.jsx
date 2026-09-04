import { useState, useEffect } from "react";
import LabCard from "../components/LabCard";
import { getLabs } from "../lib/supabaseLabs";
import { Box, Typography, CircularProgress } from "@mui/material";

export default function Map3dIndex() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoading(true);
        const data = await getLabs();
        setLabs(data);
      } catch (err) {
        console.error("Failed to load labs:", err);
        setError("Failed to load labs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: "1.75rem", md: "2.25rem" },
            fontWeight: 700,
            color: "primary.main",
            mb: 1,
          }}
        >
          3D Maps
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            fontSize: "1rem",
          }}
        >
          Choose a lab to visualize its layout and locate equipment in 3D space
        </Typography>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Display Grid */}
      {!loading && !error && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
              xl: "repeat(6, 1fr)",
            },
            gap: 2,
          }}
        >
          {labs.length === 0 ? (
            <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 8 }}>
              <Typography color="text.secondary">
                No labs available. Contact your administrator to add labs.
              </Typography>
            </Box>
          ) : (
            labs.map((lab) => (
              <Box key={lab.id} sx={{ display: "flex" }}>
                <LabCard lab={lab} />
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
