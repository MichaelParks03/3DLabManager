import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  Button,
  CardActions,
} from "@mui/material";

/**
 * LabCard Component
 * Displays lab information in a card layout
 * Used in the 3D Maps page grid view
 */
export default function LabCard({ lab }) {
  return (
    <Card
      component={RouterLink}
      to={`/map3d/${lab.id}`} // Route to 3D viewer
      sx={{
        height: 360,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        border: "1px solid",
        borderColor: "divider",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: "2px",
        },
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          position: "relative",
          height: 200,
          flexShrink: 0,
          bgcolor: "grey.100",
        }}
      >
        <CardMedia
          component="img"
          alt={`${lab.name} thumbnail`}
          image={lab.thumbnailUrl || lab.thumb}
          sx={{ objectFit: "cover", width: "100%", height: "100%" }}
          onError={(e) => {
            // Hide the broken image and show placeholder instead
            e.target.style.display = "none";
          }}
        />
        {/* Tag */}
        <Chip
          label="3D Map"
          color="secondary"
          size="small"
          sx={{ position: "absolute", top: 8, left: 8 }}
        />
      </Box>

      {/* Content */}
      <CardContent
        sx={{
          flex: "1 1 auto",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          p: 2,
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontSize: "0.98rem",
            fontWeight: 600,
            color: "text.primary",
            lineHeight: 1.2,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            minHeight: "2.4em",
          }}
        >
          {lab.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
          }}
        >
          {lab.blurb}
        </Typography>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Button variant="contained" color="primary" size="small">
          View Lab
        </Button>
      </CardActions>
    </Card>
  );
}
