import React from 'react';
import { Box, Typography, Stack, Chip, Divider } from '@mui/material';
import {
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Videocam as VideocamIcon,
  Computer as ComputerIcon,
  Smartphone as SmartphoneIcon,
  SportsEsports as VRIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';

/**
 * EquipmentDetails Component
 * Displays category-specific technical details for equipment items
 * Renders different fields based on equipment category and metadata
 */
function EquipmentDetails({ item }) {
  // Render computer specifications
  const renderComputerDetails = (metadata) => {
    const specs = [];

    if (metadata.cpu) specs.push({ label: 'CPU', value: metadata.cpu, icon: <MemoryIcon fontSize="small" /> });
    if (metadata.ram) specs.push({ label: 'RAM', value: metadata.ram, icon: <MemoryIcon fontSize="small" /> });
    if (metadata.gpu) specs.push({ label: 'GPU', value: metadata.gpu, icon: <MemoryIcon fontSize="small" /> });
    if (metadata.storage1) specs.push({ label: 'Storage 1', value: metadata.storage1, icon: <StorageIcon fontSize="small" /> });
    if (metadata.storage2) specs.push({ label: 'Storage 2', value: metadata.storage2, icon: <StorageIcon fontSize="small" /> });
    if (metadata.storage3) specs.push({ label: 'Storage 3', value: metadata.storage3, icon: <StorageIcon fontSize="small" /> });
    if (metadata.windows11Ready) specs.push({ label: 'Windows 11', value: metadata.windows11Ready, icon: <ComputerIcon fontSize="small" /> });
    if (metadata.notes) specs.push({ label: 'Notes', value: metadata.notes, fullWidth: true });

    return specs.length > 0 ? (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ComputerIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Computer Specifications
          </Typography>
        </Box>
        <Stack spacing={1.5}>
          {specs.map((spec, idx) => (
            <DetailRow key={idx} {...spec} />
          ))}
        </Stack>
      </Box>
    ) : null;
  };

  // Render VR headset specifications
  const renderVRHeadsetDetails = (metadata) => {
    const specs = [];

    if (metadata.commonName) specs.push({ label: 'Common Name', value: metadata.commonName });
    if (metadata.leftNunchuck) specs.push({ label: 'Left Controller', value: metadata.leftNunchuck });
    if (metadata.rightNunchuck) specs.push({ label: 'Right Controller', value: metadata.rightNunchuck });
    if (metadata.comments) specs.push({ label: 'Status', value: metadata.comments, fullWidth: true });

    return specs.length > 0 ? (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <VRIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            VR Headset Details
          </Typography>
        </Box>
        <Stack spacing={1.5}>
          {specs.map((spec, idx) => (
            <DetailRow key={idx} {...spec} />
          ))}
        </Stack>
      </Box>
    ) : null;
  };

  // Render tablet/phone specifications
  const renderMobileDeviceDetails = (metadata) => {
    const specs = [];

    if (metadata.imei) specs.push({ label: 'IMEI', value: metadata.imei });
    if (metadata.accountAffiliated) specs.push({ label: 'Account', value: metadata.accountAffiliated });
    if (metadata.checkedOutTo) specs.push({ label: 'Checked Out To', value: metadata.checkedOutTo });

    return specs.length > 0 ? (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmartphoneIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Device Information
          </Typography>
        </Box>
        <Stack spacing={1.5}>
          {specs.map((spec, idx) => (
            <DetailRow key={idx} {...spec} />
          ))}
        </Stack>
      </Box>
    ) : null;
  };

  // Render lab equipment specifications
  const renderLabEquipmentDetails = (metadata) => {
    const specs = [];

    if (metadata.productType) specs.push({ label: 'Product Type', value: metadata.productType });
    if (metadata.bandwidth) specs.push({ label: 'Bandwidth', value: metadata.bandwidth });
    if (metadata.channels) specs.push({ label: 'Channels', value: metadata.channels });
    if (metadata.specifications) specs.push({ label: 'Specifications', value: metadata.specifications, fullWidth: true });

    return specs.length > 0 ? (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ScienceIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Equipment Specifications
          </Typography>
        </Box>
        <Stack spacing={1.5}>
          {specs.map((spec, idx) => (
            <DetailRow key={idx} {...spec} />
          ))}
        </Stack>
      </Box>
    ) : null;
  };

  // Render webcam details
  const renderWebcamDetails = (metadata) => {
    const specs = [];

    if (metadata.resolution) specs.push({ label: 'Resolution', value: metadata.resolution });
    if (metadata.frameRate) specs.push({ label: 'Frame Rate', value: metadata.frameRate });
    if (metadata.connection) specs.push({ label: 'Connection', value: metadata.connection });

    return specs.length > 0 ? (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <VideocamIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Webcam Specifications
          </Typography>
        </Box>
        <Stack spacing={1.5}>
          {specs.map((spec, idx) => (
            <DetailRow key={idx} {...spec} />
          ))}
        </Stack>
      </Box>
    ) : null;
  };

  // Render based on category
  const renderCategorySpecificDetails = () => {
    const { category, metadata = {} } = item;

    switch (category) {
      case 'Computer':
        return renderComputerDetails(metadata);
      case 'VR Headset':
        return renderVRHeadsetDetails(metadata);
      case 'Tablet':
      case 'Phone':
        return renderMobileDeviceDetails(metadata);
      case 'Lab Equipment':
        return renderLabEquipmentDetails(metadata);
      case 'Webcam':
        return renderWebcamDetails(metadata);
      default:
        return null;
    }
  };

  // Render basic equipment info (serial, asset tag, brand, model)
  const renderBasicInfo = () => {
    const hasBasicInfo = item.serialNumber || item.assetTag || item.brand || item.model;

    if (!hasBasicInfo) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 2 }}>
          Equipment Information
        </Typography>
        <Stack spacing={1.5}>
          {item.assetTag && (
            <DetailRow label="Asset Tag" value={item.assetTag} />
          )}
          {item.brand && (
            <DetailRow label="Brand" value={item.brand} />
          )}
          {item.model && (
            <DetailRow label="Model" value={item.model} />
          )}
          {item.serialNumber && (
            <DetailRow label="Serial Number" value={item.serialNumber} monospace />
          )}
        </Stack>
      </Box>
    );
  };

  const basicInfo = renderBasicInfo();
  const categoryDetails = renderCategorySpecificDetails();

  // Don't render anything if there's no data to show
  if (!basicInfo && !categoryDetails) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 3 }} />
      {basicInfo}
      {categoryDetails}
    </Box>
  );
}

/**
 * DetailRow Component
 * Displays a single detail row with label and value
 */
function DetailRow({ label, value, icon, monospace = false, fullWidth = false }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        flexDirection: fullWidth ? 'column' : 'row',
        alignItems: fullWidth ? 'flex-start' : 'center'
      }}
    >
      {icon && (
        <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
      )}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          minWidth: fullWidth ? 'auto' : 120,
          color: 'text.primary'
        }}
      >
        {label}:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontFamily: monospace ? 'monospace' : 'inherit',
          wordBreak: fullWidth ? 'break-word' : 'normal'
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default EquipmentDetails;
