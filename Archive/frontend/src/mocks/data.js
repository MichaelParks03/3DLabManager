// Mock data for the 3D Lab Manager

export const mockItems = [
  {
    id: 'PRS001',
    name: 'Prusa MK3S+ 3D Printer',
    category: 'Printer',
    status: 'available',
    locationPath: 'Senior Lab › North Bench › Station A',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Prusa+MK3S+',
    hotspot: [0.2, 0.5, 0.3],
    amazonLink: 'https://www.amazon.com/Original-Removable-Beginner-Friendly-Automatic-Calibration/dp/B0DLHJB9HW/ref=sr_1_1_sspa?crid=9A9GIPJ791QP&dib=eyJ2IjoiMSJ9.3-dj71JTbCR0cMTGV4lT6GIiZX7E7skYWlwMvFH9Oxcv2OfUpvMdAS9-AtwHFEJ4JAXqAufSO4cEb6fyJMcO056lQgaOjd2zZqV9qPy360JvnNGl95S1RY7lXZl_JWuxiaqOdCwS_--pZsF6kVtcNTduzeE26JmtXnYAt1OTGwPHOdUL6EFQFkgPB5l4eiuqsz9_hXvaOvBW8SJR-WBKIzBiVnceNhrFQ3ininMJ_m8.OLZwT1pzaNdqaqmt2ALWpve-1xo1AO-6YVH9Yxirn1A&dib_tag=se&keywords=Prusa%2BMK3S%2BPrinter&qid=1764119588&sprefix=prusa%2Bmk3s%2Bprinter%2Caps%2C176&sr=8-1-spons&ufe=app_do%3Aamzn1.fos.5998aa40-ec6f-4947-a68f-cd087fee0848&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1'
  },
  {
    id: 'END001',
    name: 'Ender 3 V2',
    category: 'Printer',
    status: 'checked_out',
    locationPath: 'Senior Lab › South Bench › Station B',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Ender+3+V2',
    hotspot: [0.8, 0.5, 0.3]
  },
  {
    id: 'ULT001',
    name: 'Ultimaker S3',
    category: 'Printer',
    status: 'broken',
    locationPath: 'Senior Lab › Central Table › Station C',
    thumbnailUrl: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Ultimaker+S3',
    hotspot: [0.5, 0.5, 0.6]
  },
  {
    id: 'SOL001',
    name: 'Soldering Iron Kit',
    category: 'Electronics',
    status: 'available',
    locationPath: 'Electronics Bench › Drawer A',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Soldering+Kit'
  },
  {
    id: 'MUL001',
    name: 'Digital Multimeter',
    category: 'Electronics',
    status: 'available',
    locationPath: 'Electronics Bench › Shelf 1',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Multimeter'
  },
  {
    id: 'OSC001',
    name: 'Oscilloscope',
    category: 'Electronics',
    status: 'checked_out',
    locationPath: 'Electronics Bench › Station 1',
    thumbnailUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Oscilloscope'
  },
  {
    id: 'DRL001',
    name: 'Cordless Drill Set',
    category: 'Tool',
    status: 'available',
    locationPath: 'Tool Cabinet › Shelf 2',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Drill+Set'
  },
  {
    id: 'SAW001',
    name: 'Circular Saw',
    category: 'Tool',
    status: 'available',
    locationPath: 'Tool Cabinet › Bottom Shelf',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Circular+Saw'
  },
  {
    id: 'CAL001',
    name: 'Digital Calipers',
    category: 'Tool',
    status: 'checked_out',
    locationPath: 'Measurement Tools › Drawer 1',
    thumbnailUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Calipers'
  },
  {
    id: 'PLA001',
    name: 'PLA Filament - White',
    category: 'Material',
    status: 'available',
    locationPath: 'Material Storage › Rack A › Slot 1',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=PLA+White'
  },
  {
    id: 'PLA002',
    name: 'PLA Filament - Black',
    category: 'Material',
    status: 'available',
    locationPath: 'Material Storage › Rack A › Slot 2',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=PLA+Black'
  },
  {
    id: 'ABS001',
    name: 'ABS Filament - Red',
    category: 'Material',
    status: 'available',
    locationPath: 'Material Storage › Rack B › Slot 1',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=ABS+Red'
  },
  {
    id: 'PETG001',
    name: 'PETG Filament - Clear',
    category: 'Material',
    status: 'broken',
    locationPath: 'Material Storage › Rack B › Slot 3',
    thumbnailUrl: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=PETG+Clear'
  },
  {
    id: 'SAF001',
    name: 'Safety Glasses Set',
    category: 'Safety',
    status: 'available',
    locationPath: 'Safety Station › Wall Mount',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Safety+Glasses'
  },
  {
    id: 'GLV001',
    name: 'Heat Resistant Gloves',
    category: 'Safety',
    status: 'available',
    locationPath: 'Safety Station › Drawer A',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Heat+Gloves'
  },
  {
    id: 'EXT001',
    name: 'Fire Extinguisher',
    category: 'Safety',
    status: 'available',
    locationPath: 'Safety Station › Wall Mount',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Extinguisher'
  },
  {
    id: 'ARD001',
    name: 'Arduino Uno R3',
    category: 'Electronics',
    status: 'available',
    locationPath: 'Electronics Bench › Component Drawer',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Arduino+Uno',
    amazonLink: 'https://www.amazon.com/Arduino-A000066-ARDUINO-UNO-R3/dp/B008GRTSV6/ref=sr_1_1?dib=eyJ2IjoiMSJ9.MazmhFfn-DF8W5oyX_S-tDFAqLRDaMJSkroaZhdQMdhpGLdQMZg0O8c8oGtEXE_3KITn5L9NtwYmgN0pAkE-bcCAfjw0X__Ws5aGu8rCsuUmEMzFLlvMWd-j96-ufQUokE8GxhjuBAIuqBvpjkAnv_ncKEOozrGwkhuNPnGlNpwitkfJHVjMZBv3X7tj28tKm_1WdUbI4mxcarL_TzJGbupGwgYyclzpry9Ym1VTq-k.uWMSXnbOSBfvT99ZyMQtJGqPTdWaM3GkcdqhIjmM0EU&dib_tag=se&hvadid=410081496133&hvdev=c&hvexpln=0&hvlocphy=9027307&hvnetw=g&hvocijid=1145713816427838007--&hvqmt=e&hvrand=1145713816427838007&hvtargid=kwd-44729630490&hydadcr=18006_11412182&keywords=arduino%2Buno%2B-%2Br3&mcid=a0ad9341261933b08fefdf797b2ed3ff&qid=1764119166&sr=8-1&th=1'
  },
  {
    id: 'RAS001',
    name: 'Raspberry Pi 4',
    category: 'Electronics',
    status: 'checked_out',
    locationPath: 'Electronics Bench › Component Drawer',
    thumbnailUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Raspberry+Pi'
  },
  {
    id: 'LED001',
    name: 'LED Strip Kit',
    category: 'Electronics',
    status: 'available',
    locationPath: 'Electronics Bench › Parts Bin 1',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=LED+Strip'
  },
  {
    id: 'CAM001',
    name: 'Web Camera Module',
    category: 'Electronics',
    status: 'available',
    locationPath: 'Electronics Bench › Parts Bin 2',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Web+Camera'
  },
  {
    id: 'SNS001',
    name: 'Sensor Kit (Temperature/Humidity)',
    category: 'Electronics',
    status: 'available',
    locationPath: 'Electronics Bench › Parts Bin 3',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Sensor+Kit'
  },
  {
    id: 'PWR001',
    name: 'Power Supply Unit 24V',
    category: 'Electronics',
    status: 'broken',
    locationPath: 'Electronics Bench › Under Table Storage',
    thumbnailUrl: 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Power+Supply'
  },
  {
    id: 'MTR001',
    name: 'Stepper Motor Set',
    category: 'Electronics',
    status: 'available',
    locationPath: 'Electronics Bench › Component Box A',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Stepper+Motors'
  },
  {
    id: 'HEX001',
    name: 'Hex Key Set (Metric)',
    category: 'Tool',
    status: 'available',
    locationPath: 'Tool Cabinet › Small Tools Drawer',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Hex+Keys'
  },
  {
    id: 'SCR001',
    name: 'Screwdriver Set',
    category: 'Tool',
    status: 'available',
    locationPath: 'Tool Cabinet › Small Tools Drawer',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Screwdrivers'
  },
  {
    id: 'MIC001',
    name: 'Digital Microscope',
    category: 'Other',
    status: 'available',
    locationPath: 'Inspection Station › Table Mount',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Microscope'
  },
  {
    id: 'LAB001',
    name: 'Label Printer',
    category: 'Other',
    status: 'available',
    locationPath: 'Admin Desk › Left Side',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Label+Printer'
  },
  {
    id: 'VAC001',
    name: 'Shop Vacuum',
    category: 'Other',
    status: 'available',
    locationPath: 'Storage Closet › Floor',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Shop+Vacuum'
  },
  {
    id: 'WOR001',
    name: 'Workbench Light',
    category: 'Other',
    status: 'checked_out',
    locationPath: 'Mobile Equipment › Charging Station',
    thumbnailUrl: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Work+Light'
  },
  {
    id: 'EXT002',
    name: 'Extension Cord 50ft',
    category: 'Other',
    status: 'available',
    locationPath: 'Storage Closet › Wall Hook',
    thumbnailUrl: 'https://via.placeholder.com/300x200/2563eb/ffffff?text=Extension+Cord'
  }
];