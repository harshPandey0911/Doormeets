import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiCheck, FiArrowRight, FiArrowLeft, FiPlus, FiTrash2,
  FiUploadCloud, FiInfo, FiDollarSign, FiPercent, FiEdit3, FiEye, FiFileText, FiAlertCircle
} from 'react-icons/fi';
import {
  getQuotationByConsultationId,
  saveQuotationDraft,
  updateQuotationDraft,
  submitQuotationToAdmin,
  getPaintingProducts,
  getLabourRatesForVendor,
  getTemplatesForVendor,
  getSettingsForVendor
} from '../../services/paintingConsultationService';

const WALL_TYPES = ['Standard', 'Partition', 'Exterior', 'Curved', 'Glass', 'Feature', 'Texture'];
const SURFACE_MATERIALS = ['Concrete', 'Brick', 'POP', 'Gypsum', 'Wood', 'Metal', 'Glass'];
const WALL_CONDITIONS = ['Excellent', 'Good', 'Average', 'Damp', 'Peeling', 'Cracked', 'Seepage'];
const OPENING_TYPES = ['Door', 'Window', 'French Window', 'Sliding Window', 'Ventilator', 'Arch', 'Custom'];
const PAINTABLE_OBJECTS = ['Door', 'Window', 'Grill', 'Railing', 'Cupboard', 'Wardrobe', 'False Ceiling', 'Beam', 'Column', 'TV Unit', 'Cabinet', 'Shelf', 'Custom'];

const createDefaultRoom = (name, roomCode) => {
  return {
    name,
    roomCode: roomCode || 'CUSTOM',
    length: 12,
    width: 10,
    height: 10,
    paintCeiling: true,
    paintWalls: true,
    measurementMode: 'DIMENSIONS',
    walls: [
      { name: 'Wall 1 (North)', width: 12, height: 10, thickness: 0, wallType: 'Standard', material: 'Concrete', condition: 'Good', openings: [] },
      { name: 'Wall 2 (East)', width: 10, height: 10, thickness: 0, wallType: 'Standard', material: 'Concrete', condition: 'Good', openings: [] },
      { name: 'Wall 3 (South)', width: 12, height: 10, thickness: 0, wallType: 'Standard', material: 'Concrete', condition: 'Good', openings: [] },
      { name: 'Wall 4 (West)', width: 10, height: 10, thickness: 0, wallType: 'Standard', material: 'Concrete', condition: 'Good', openings: [] }
    ],
    paintItems: [],
    calculationBreakdown: {},
    vendorOverride: { overrideActive: false, manualArea: 0, reason: '', photoEvidence: [] },
    photos: { before: [], damage: [], reference: [], after: [], video: '' },
    kitchenExtras: { cabinetWidth: 0, cabinetHeight: 0, backsplashHeight: 0, tileHeight: 0 },
    bathroomExtras: { tileHeight: 0, ventilatorWidth: 0, ventilatorHeight: 0, mirrorArea: 0 },
    livingRoomExtras: { featureWallArea: 0, textureWallArea: 0, tvPanelArea: 0, woodPanelArea: 0, wallpaperArea: 0 },
    balconyExtras: { railingLength: 0, grillArea: 0 },
    exteriorExtras: { parapetWallArea: 0 }
  };
};

const calculateRoomAreas = (room) => {
  let grossWallArea = 0;
  let doorDeduction = 0;
  let windowDeduction = 0;
  let cabinetDeduction = 0;
  let tileDeduction = 0;
  let mirrorDeduction = 0;
  let ventilatorDeduction = 0;
  let wallpaperDeduction = 0;

  let textureArea = 0;
  let featureWallArea = 0;
  let doorPaintArea = 0;
  let windowPaintArea = 0;
  let grillPaintArea = 0;
  let ceilingArea = 0;
  let additionalPaintItems = 0;

  // 1. Ceiling area
  if (room.paintCeiling) {
    ceilingArea = Number(room.length) * Number(room.width);
  }

  // 2. Process walls
  if (room.measurementMode === 'DIMENSIONS') {
    const l = Number(room.length) || 0;
    const w = Number(room.width) || 0;
    const h = Number(room.height) || 0;

    let paintHeight = h;
    if (room.roomCode === 'BATHROOM') {
      const tileH = Number(room.bathroomExtras?.tileHeight) || 0;
      paintHeight = Math.max(0, h - tileH);
    }

    grossWallArea = 2 * (l + w) * paintHeight;

    if (room.roomCode === 'KITCHEN') {
      const backsplashH = Number(room.kitchenExtras?.backsplashHeight) || 0;
      tileDeduction = 2 * (l + w) * backsplashH;
    }
  } else if (room.measurementMode === 'WALLS') {
    (room.walls || []).forEach(wall => {
      const wWidth = Number(wall.width) || 0;
      const wHeight = Number(wall.height) || 0;

      let paintHeight = wHeight;
      if (room.roomCode === 'BATHROOM') {
        const tileH = Number(room.bathroomExtras?.tileHeight) || 0;
        paintHeight = Math.max(0, wHeight - tileH);
      }

      const wallGross = wWidth * paintHeight;
      grossWallArea += wallGross;

      if (wall.wallType === 'Feature') {
        featureWallArea += wallGross;
      }
      if (wall.wallType === 'Texture') {
        textureArea += wallGross;
      }

      if (wall.openings && wall.openings.length > 0) {
        wall.openings.forEach(op => {
          const opW = Number(op.width) || 0;
          const opH = Number(op.height) || 0;
          const opArea = opW * opH;

          if (op.paint) {
            if (op.type === 'Door') doorPaintArea += opArea;
            else if (['Window', 'French Window', 'Sliding Window'].includes(op.type)) windowPaintArea += opArea;
            else if (op.type === 'Ventilator') grillPaintArea += opArea;
          } else {
            if (op.type === 'Door') doorDeduction += opArea;
            else if (['Window', 'French Window', 'Sliding Window'].includes(op.type)) windowDeduction += opArea;
            else if (op.type === 'Ventilator') ventilatorDeduction += opArea;
          }
        });
      }
    });
  } else if (room.measurementMode === 'MANUAL') {
    return {
      grossWallArea: 0,
      doorDeduction: 0,
      windowDeduction: 0,
      cabinetDeduction: 0,
      tileDeduction: 0,
      mirrorDeduction: 0,
      ventilatorDeduction: 0,
      wallpaperDeduction: 0,
      textureArea: 0,
      featureWallArea: 0,
      doorPaintArea: 0,
      windowPaintArea: 0,
      grillPaintArea: 0,
      ceilingArea: room.paintCeiling ? (Number(room.length) * Number(room.width)) : 0,
      additionalPaintItems: 0,
      netPaintableArea: Number(room.vendorOverride?.manualArea) || 0
    };
  }

  if (room.roomCode === 'KITCHEN') {
    const cabW = Number(room.kitchenExtras?.cabinetWidth) || 0;
    const cabH = Number(room.kitchenExtras?.cabinetHeight) || 0;
    cabinetDeduction = cabW * cabH;
  }

  if (room.roomCode === 'BATHROOM') {
    mirrorDeduction = Number(room.bathroomExtras?.mirrorArea) || 0;
    if (room.measurementMode === 'DIMENSIONS') {
      const ventW = Number(room.bathroomExtras?.ventilatorWidth) || 0;
      const ventH = Number(room.bathroomExtras?.ventilatorHeight) || 0;
      ventilatorDeduction = ventW * ventH;
    }
  }

  if (room.roomCode === 'LIVING_ROOM') {
    if (room.measurementMode === 'DIMENSIONS') {
      featureWallArea = Number(room.livingRoomExtras?.featureWallArea) || 0;
      textureArea = Number(room.livingRoomExtras?.textureWallArea) || 0;
    }
    cabinetDeduction += Number(room.livingRoomExtras?.tvPanelArea) || 0;
    wallpaperDeduction = Number(room.livingRoomExtras?.wallpaperArea) || 0;
  }

  if (room.roomCode === 'BALCONY') {
    const railingL = Number(room.balconyExtras?.railingLength) || 0;
    grillPaintArea = Number(room.balconyExtras?.grillArea) || 0;
    additionalPaintItems += railingL * 2;
  }

  if (room.roomCode === 'EXTERIOR') {
    additionalPaintItems += Number(room.exteriorExtras?.parapetWallArea) || 0;
  }

  if (room.paintItems && room.paintItems.length > 0) {
    room.paintItems.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const unit = Number(item.unitArea) || 0;
      additionalPaintItems += qty * unit;
    });
  }

  const netWallArea = room.paintWalls ? Math.max(0,
    grossWallArea
    - doorDeduction
    - windowDeduction
    - cabinetDeduction
    - tileDeduction
    - mirrorDeduction
    - ventilatorDeduction
    - wallpaperDeduction
    + featureWallArea
    + textureArea
    + doorPaintArea
    + windowPaintArea
    + grillPaintArea
  ) : 0;

  return {
    grossWallArea: room.paintWalls ? grossWallArea : 0,
    doorDeduction: room.paintWalls ? doorDeduction : 0,
    windowDeduction: room.paintWalls ? windowDeduction : 0,
    cabinetDeduction: room.paintWalls ? cabinetDeduction : 0,
    tileDeduction: room.paintWalls ? tileDeduction : 0,
    mirrorDeduction: room.paintWalls ? mirrorDeduction : 0,
    ventilatorDeduction: room.paintWalls ? ventilatorDeduction : 0,
    wallpaperDeduction: room.paintWalls ? wallpaperDeduction : 0,
    textureArea: room.paintWalls ? textureArea : 0,
    featureWallArea: room.paintWalls ? featureWallArea : 0,
    doorPaintArea: room.paintWalls ? doorPaintArea : 0,
    windowPaintArea: room.paintWalls ? windowPaintArea : 0,
    grillPaintArea: room.paintWalls ? grillPaintArea : 0,
    ceilingArea,
    additionalPaintItems,
    netPaintableArea: netWallArea + ceilingArea + additionalPaintItems
  };
}; const mapQuoteRoomToState = (r) => {
  const wallsList = r.walls && r.walls.length > 0 ? r.walls.map(w => ({
    name: w.name,
    width: w.width || w.length || 0,
    height: w.height || 0,
    thickness: w.thickness || 0,
    wallType: w.wallType || 'Standard',
    material: w.material || 'Concrete',
    condition: w.condition || 'Good',
    openings: (w.openings || []).map(o => ({
      type: o.type || 'Door',
      width: o.width || 0,
      height: o.height || 0,
      paint: o.paint || false,
      frameMaterial: o.frameMaterial || '',
      remarks: o.remarks || ''
    }))
  })) : [
    { name: 'Wall 1 (North)', width: r.ceiling?.length || 12, height: r.height || 10, thickness: 0, wallType: 'Standard', material: 'Concrete', condition: 'Good', openings: [] },
    { name: 'Wall 2 (East)', width: r.ceiling?.width || 10, height: r.height || 10, thickness: 0, wallType: 'Standard', material: 'Concrete', condition: 'Good', openings: [] },
    { name: 'Wall 3 (South)', width: r.ceiling?.length || 12, height: r.height || 10, thickness: 0, wallType: 'Standard', material: 'Concrete', condition: 'Good', openings: [] },
    { name: 'Wall 4 (West)', width: r.ceiling?.width || 10, height: r.height || 10, thickness: 0, wallType: 'Standard', material: 'Concrete', condition: 'Good', openings: [] }
  ];

  return {
    name: r.name,
    roomCode: r.roomCode || 'CUSTOM',
    length: r.ceiling?.length || r.length || 12,
    width: r.ceiling?.width || r.width || 10,
    height: r.height || 10,
    paintCeiling: r.ceiling?.included || r.paintCeiling || false,
    paintWalls: r.paintWalls !== undefined ? r.paintWalls : true,
    measurementMode: r.measurementMode || 'DIMENSIONS',
    walls: wallsList,
    paintItems: (r.paintItems || []).map(pi => ({
      name: pi.name || 'Door',
      quantity: pi.quantity || 1,
      unitArea: pi.unitArea || 0,
      totalArea: pi.totalArea || 0,
      itemType: pi.itemType || 'Custom'
    })),
    calculationBreakdown: r.calculationBreakdown || {},
    vendorOverride: r.vendorOverride || { overrideActive: false, manualArea: 0, reason: '', photoEvidence: [] },
    photos: r.photos || { before: [], damage: [], reference: [], after: [], video: '' },
    kitchenExtras: {
      cabinetWidth: r.kitchenExtras?.cabinetWidth || r.calculationBreakdown?.cabinetWidth || 0,
      cabinetHeight: r.kitchenExtras?.cabinetHeight || r.calculationBreakdown?.cabinetHeight || 0,
      backsplashHeight: r.kitchenExtras?.backsplashHeight || r.calculationBreakdown?.backsplashHeight || 0,
      tileHeight: r.kitchenExtras?.tileHeight || r.calculationBreakdown?.tileHeight || 0
    },
    bathroomExtras: {
      tileHeight: r.bathroomExtras?.tileHeight || r.calculationBreakdown?.tileHeight || 0,
      ventilatorWidth: r.bathroomExtras?.ventilatorWidth || r.calculationBreakdown?.ventilatorWidth || 0,
      ventilatorHeight: r.bathroomExtras?.ventilatorHeight || r.calculationBreakdown?.ventilatorHeight || 0,
      mirrorArea: r.bathroomExtras?.mirrorArea || r.calculationBreakdown?.mirrorArea || 0
    },
    livingRoomExtras: {
      featureWallArea: r.livingRoomExtras?.featureWallArea || r.calculationBreakdown?.featureWallArea || 0,
      textureWallArea: r.livingRoomExtras?.textureWallArea || r.calculationBreakdown?.textureWallArea || 0,
      tvPanelArea: r.livingRoomExtras?.tvPanelArea || r.calculationBreakdown?.tvPanelArea || 0,
      woodPanelArea: r.livingRoomExtras?.woodPanelArea || r.calculationBreakdown?.woodPanelArea || 0,
      wallpaperArea: r.livingRoomExtras?.wallpaperArea || r.calculationBreakdown?.wallpaperArea || 0
    },
    balconyExtras: {
      railingLength: r.balconyExtras?.railingLength || r.calculationBreakdown?.railingLength || 0,
      grillArea: r.balconyExtras?.grillArea || r.calculationBreakdown?.grillArea || 0
    },
    exteriorExtras: {
      parapetWallArea: r.exteriorExtras?.parapetWallArea || r.calculationBreakdown?.parapetWallArea || 0
    }
  };
}; const getRoomProgress = (r) => {
  let progress = 0;
  if (r.measurementMode === 'MANUAL' && (Number(r.vendorOverride?.manualArea) > 0)) {
    progress += 40;
  } else if (r.measurementMode === 'WALLS' && (r.walls && r.walls.length > 0)) {
    progress += 40;
  } else if (r.measurementMode === 'DIMENSIONS' && (Number(r.length) > 0 && Number(r.width) > 0 && Number(r.height) > 0)) {
    progress += 40;
  }

  if (r.paintWalls || r.paintCeiling) {
    progress += 30;
  }

  let detailed = false;
  if (r.paintItems && r.paintItems.length > 0) detailed = true;
  if (r.walls && r.walls.some(w => w.openings && w.openings.length > 0)) detailed = true;
  if (r.kitchenExtras && (Number(r.kitchenExtras.cabinetWidth) > 0 || Number(r.kitchenExtras.backsplashHeight) > 0)) detailed = true;
  if (r.bathroomExtras && Number(r.bathroomExtras.tileHeight) > 0) detailed = true;
  if (r.livingRoomExtras && (Number(r.livingRoomExtras.featureWallArea) > 0 || Number(r.livingRoomExtras.wallpaperArea) > 0)) detailed = true;

  if (detailed) {
    progress += 30;
  } else {
    progress += 15;
  }
  return Math.min(100, progress);
};


const STEPS = [
  { label: 'Property Summary', icon: '🏠' },
  { label: 'Paint Brand', icon: '🎨' },
  { label: 'Paint Product', icon: '🖌️' },
  { label: 'Primer', icon: '🧪' },
  { label: 'Putty', icon: '🧱' },
  { label: 'Labour Rate', icon: '👷' },
  { label: 'Optional Charges', icon: '⚡' },
  { label: 'Review Quotation', icon: '📊' },
  { label: 'Submit to Admin', icon: '📤' }
];

const VendorQuoteWizard = ({ consultation, onBack, onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quoteId, setQuoteId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  // Master lists
  const [productsList, setProductsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [labourRatesList, setLabourRatesList] = useState([]);
  const [templatesList, setTemplatesList] = useState([]);

  // Form State
  const [property, setProperty] = useState({
    propertyType: consultation?.propertyType || '2BHK',
    interiorArea: 0,
    exteriorArea: 0,
    ceilingArea: 0,
    balconyArea: 0,
    totalPaintableArea: 0
  });

  const [rooms, setRooms] = useState([]);
  const [expandedRoomIdx, setExpandedRoomIdx] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [settingsSnapshot, setSettingsSnapshot] = useState(null);

  // Selection keys map to productId, selectedPackSize, and coats
  const [selectedProducts, setSelectedProducts] = useState({
    interiorPaint: { productId: '', selectedPackSize: null, coats: 2 },
    exteriorPaint: { productId: '', selectedPackSize: null, coats: 2 },
    ceilingPaint: { productId: '', selectedPackSize: null, coats: 2 },
    balconyPaint: { productId: '', selectedPackSize: null, coats: 2 },
    interiorPrimer: { productId: '', selectedPackSize: null, coats: 1 },
    exteriorPrimer: { productId: '', selectedPackSize: null, coats: 1 },
    interiorPutty: { productId: '', selectedPackSize: null, coats: 2 },
    exteriorPutty: { productId: '', selectedPackSize: null, coats: 2 }
  });

  const [selectedLabour, setSelectedLabour] = useState({
    interiorLabour: '', // labourRateId
    exteriorLabour: ''  // labourRateId
  });

  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [discount, setDiscount] = useState({
    type: 'NONE', // 'FLAT', 'PERCENTAGE', 'NONE'
    value: 0,
    reason: ''
  });

  const [remarks, setRemarks] = useState({
    vendorRemarks: '',
    customerRemarks: '',
    adminRemarks: ''
  });

  const [attachments, setAttachments] = useState({
    inspectionPhotos: [],
    beforePhotos: [],
    referenceImages: []
  });

  // Mock Upload state
  const [uploading, setUploading] = useState({
    inspectionPhotos: false,
    beforePhotos: false,
    referenceImages: false
  });

  // Automatically calculate total areas from room dimensions
  useEffect(() => {
    let intArea = 0;
    let extArea = 0;
    let ceilArea = 0;
    let balcArea = 0;

    rooms.forEach(r => {
      const breakdown = calculateRoomAreas(r);
      const wallArea = breakdown.netPaintableArea - (r.paintCeiling ? breakdown.ceilingArea : 0);
      const ceilingFloor = breakdown.ceilingArea || (Number(r.length) * Number(r.width));

      if (r.paintWalls) {
        if (r.roomCode === 'BALCONY') {
          balcArea += wallArea;
        } else if (r.roomCode === 'EXTERIOR') {
          extArea += wallArea;
        } else {
          intArea += wallArea;
        }
      }

      if (r.paintCeiling) {
        ceilArea += ceilingFloor;
      }
    });

    setProperty(prev => ({
      ...prev,
      interiorArea: parseFloat(intArea.toFixed(2)),
      exteriorArea: parseFloat(extArea.toFixed(2)),
      ceilingArea: parseFloat(ceilArea.toFixed(2)),
      balconyArea: parseFloat(balcArea.toFixed(2)),
      totalPaintableArea: parseFloat((intArea + extArea + ceilArea + balcArea).toFixed(2))
    }));
  }, [rooms]);

  // Fetch initial master data and draft quote
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // 1. Fetch products, labour rates, templates, and settings snapshot
        const prodRes = await getPaintingProducts();
        const labRes = await getLabourRatesForVendor();
        const tmplRes = await getTemplatesForVendor();
        const settingsRes = await getSettingsForVendor();

        if (settingsRes?.success && settingsRes.data?.activeVersionId?.snapshot) {
          setSettingsSnapshot(settingsRes.data.activeVersionId.snapshot);
        }

        let fetchedProducts = [];
        if (prodRes?.success) {
          fetchedProducts = prodRes.data;
          setProductsList(prodRes.data);

          // Extract unique brands
          const brandsMap = {};
          prodRes.data.forEach(p => {
            if (p.brandId && p.brandId._id) {
              brandsMap[p.brandId._id] = p.brandId;
            }
          });
          setBrandsList(Object.values(brandsMap));
        }

        if (labRes?.success) {
          setLabourRatesList(labRes.data);
        }

        if (tmplRes?.success) {
          setTemplatesList(tmplRes.data);
        }

        // 2. Fetch existing quotation draft if any
        if (consultation?._id) {
          const quoteRes = await getQuotationByConsultationId(consultation._id);
          if (quoteRes?.success && quoteRes.data) {
            const q = quoteRes.data;
            setQuoteId(q._id);
            setCurrentStatus(q.status);
            setIsReadOnly(q.status !== 'DRAFT' && q.status !== 'ADMIN_REJECTED' && q.status !== 'REVISION_REQUESTED');

            // Map database fields to frontend state
            if (q.property) {
              setProperty({
                propertyType: q.property.propertyType || consultation?.propertyType || '2BHK',
                interiorArea: q.property.interiorArea || 0,
                exteriorArea: q.property.exteriorArea || 0,
                ceilingArea: q.property.ceilingArea || 0,
                balconyArea: q.property.balconyArea || 0,
                totalPaintableArea: q.property.totalPaintableArea || 0
              });
            }

            // Map rooms back if saved in database quote
            if (q.rooms && q.rooms.length > 0) {
              setRooms(q.rooms.map(r => mapQuoteRoomToState(r)));
            } else {
              // Build initial rooms list from template snapshot matching property type
              const matchTmpl = tmplRes.data?.find(t => t.code === (q.property?.propertyType || consultation?.propertyType || '2BHK'));
              if (matchTmpl && matchTmpl.rooms) {
                setRooms(matchTmpl.rooms.map(r => createDefaultRoom(r.name, r.roomCode)));
              } else {
                setRooms([
                  createDefaultRoom('Living Room', 'LIVING_ROOM'),
                  createDefaultRoom('Bedroom', 'BEDROOM')
                ]);
              }
            }

            // Map products back to keys
            const mappedProds = {
              interiorPaint: { productId: '', selectedPackSize: null, coats: 2 },
              exteriorPaint: { productId: '', selectedPackSize: null, coats: 2 },
              ceilingPaint: { productId: '', selectedPackSize: null, coats: 2 },
              balconyPaint: { productId: '', selectedPackSize: null, coats: 2 },
              interiorPrimer: { productId: '', selectedPackSize: null, coats: 1 },
              exteriorPrimer: { productId: '', selectedPackSize: null, coats: 1 },
              interiorPutty: { productId: '', selectedPackSize: null, coats: 2 },
              exteriorPutty: { productId: '', selectedPackSize: null, coats: 2 }
            };

            let brandSet = false;
            q.products.forEach(p => {
              if (!brandSet && p.brandId) {
                setSelectedBrand(p.brandId.toString());
                brandSet = true;
              }

              const pId = p.productId?._id || p.productId;
              const savedCoats = p.coats !== undefined ? Number(p.coats) : (p.productType === 'Primer' ? 1 : 2);

              if (p.productType === 'Paint') {
                if (p.appliedArea === q.property?.interiorArea && q.property?.interiorArea > 0 && !mappedProds.interiorPaint.productId) {
                  mappedProds.interiorPaint = { productId: pId, selectedPackSize: p.selectedPackSize, coats: savedCoats };
                } else if (p.appliedArea === q.property?.exteriorArea && q.property?.exteriorArea > 0 && !mappedProds.exteriorPaint.productId) {
                  mappedProds.exteriorPaint = { productId: pId, selectedPackSize: p.selectedPackSize, coats: savedCoats };
                } else if (p.appliedArea === q.property?.ceilingArea && q.property?.ceilingArea > 0 && !mappedProds.ceilingPaint.productId) {
                  mappedProds.ceilingPaint = { productId: pId, selectedPackSize: p.selectedPackSize, coats: savedCoats };
                } else if (p.appliedArea === q.property?.balconyArea && q.property?.balconyArea > 0 && !mappedProds.balconyPaint.productId) {
                  mappedProds.balconyPaint = { productId: pId, selectedPackSize: p.selectedPackSize, coats: savedCoats };
                }
              } else if (p.productType === 'Primer') {
                if (p.appliedArea === (q.property?.interiorArea + q.property?.ceilingArea) && !mappedProds.interiorPrimer.productId) {
                  mappedProds.interiorPrimer = { productId: pId, selectedPackSize: p.selectedPackSize, coats: savedCoats };
                } else if (p.appliedArea === (q.property?.exteriorArea + q.property?.balconyArea) && !mappedProds.exteriorPrimer.productId) {
                  mappedProds.exteriorPrimer = { productId: pId, selectedPackSize: p.selectedPackSize, coats: savedCoats };
                }
              } else if (p.productType === 'Putty') {
                if (p.appliedArea === (q.property?.interiorArea + q.property?.ceilingArea) && !mappedProds.interiorPutty.productId) {
                  mappedProds.interiorPutty = { productId: pId, selectedPackSize: p.selectedPackSize, coats: savedCoats };
                } else if (p.appliedArea === (q.property?.exteriorArea + q.property?.balconyArea) && !mappedProds.exteriorPutty.productId) {
                  mappedProds.exteriorPutty = { productId: pId, selectedPackSize: p.selectedPackSize, coats: savedCoats };
                }
              }
            });
            setSelectedProducts(mappedProds);

            // Map labour
            const mappedLabour = { interiorLabour: '', exteriorLabour: '' };
            q.labour.forEach(l => {
              const lId = l.labourRateId?._id || l.labourRateId;
              const rateObj = labRes.data?.find(r => r._id === lId.toString());
              if (rateObj) {
                if (rateObj.application === 'INTERIOR') {
                  mappedLabour.interiorLabour = lId;
                } else {
                  mappedLabour.exteriorLabour = lId;
                }
              }
            });
            setSelectedLabour(mappedLabour);

            setAdditionalCharges(q.additionalCharges || []);
            setDiscount(q.discount || { type: 'NONE', value: 0, reason: '' });
            setRemarks(q.remarks || { vendorRemarks: '', customerRemarks: '', adminRemarks: '' });
            setAttachments(q.attachments || { inspectionPhotos: [], beforePhotos: [], referenceImages: [] });
          } else {
            // Build rooms array based on matching layout template when generating new quote
            const matchTmpl = tmplRes.data?.find(t => t.code === (consultation?.propertyType || '2BHK'));
            if (matchTmpl && matchTmpl.rooms) {
              setRooms(matchTmpl.rooms.map(r => createDefaultRoom(r.name, r.roomCode)));
            } else {
              setRooms([
                createDefaultRoom('Living Room', 'LIVING_ROOM'),
                createDefaultRoom('Bedroom', 'BEDROOM')
              ]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load wizard resources:', err);
        toast.error('Error loading configuration details.');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [consultation]);

  // Compute live calculations using the fetched settingsSnapshot
  const getOptimalPacks = (requiredQty, availableSizes) => {
    if (!availableSizes || !Array.isArray(availableSizes) || availableSizes.length === 0) {
      return [{ size: 1, count: Math.ceil(requiredQty) }];
    }

    const sizes = availableSizes
      .map(p => (typeof p === 'object' && p !== null) ? Number(p.size) : Number(p))
      .filter(s => !isNaN(s) && s > 0)
      .sort((a, b) => b - a);

    if (sizes.length === 0) {
      return [{ size: 1, count: Math.ceil(requiredQty) }];
    }

    if (requiredQty <= 0) return [];

    let bestCombo = null;
    let bestVolume = Infinity;
    let bestPackCount = Infinity;

    const isBetter = (volume, packCount) => {
      if (volume < bestVolume - 0.0001) return true;
      if (Math.abs(volume - bestVolume) < 0.0001) {
        return packCount < bestPackCount;
      }
      return false;
    };

    const search = (index, currentVolume, currentPackCount, currentCombo) => {
      if (currentVolume >= bestVolume + 0.0001 && currentVolume > requiredQty) {
        return;
      }

      if (currentVolume >= requiredQty - 0.0001) {
        if (isBetter(currentVolume, currentPackCount)) {
          bestVolume = currentVolume;
          bestPackCount = currentPackCount;
          bestCombo = { ...currentCombo };
        }
        return;
      }

      if (index >= sizes.length) {
        return;
      }

      const size = sizes[index];
      const maxPacks = Math.ceil((requiredQty - currentVolume) / size);

      for (let count = maxPacks; count >= 0; count--) {
        const nextVolume = currentVolume + count * size;
        const nextPackCount = currentPackCount + count;
        
        currentCombo[size] = count;
        search(index + 1, nextVolume, nextPackCount, currentCombo);
        if (count === 0) {
          delete currentCombo[size];
        }
      }
    };

    search(0, 0, 0, {});

    const result = [];
    if (bestCombo) {
      for (const sizeStr of Object.keys(bestCombo)) {
        const size = parseFloat(sizeStr);
        const count = bestCombo[sizeStr];
        if (count > 0) {
          result.push({ size, count });
        }
      }
    }

    result.sort((a, b) => b.size - a.size);
    return result;
  };

  // Compute live calculations using the fetched settingsSnapshot
  const calculateCosts = () => {
    let materialCost = 0;
    let labourCost = 0;
    let additionalCost = 0;

    const selectedProductDetails = [];
    const selectedLabourDetails = [];

    // Helper for products mapping
    const productMappings = [
      { key: 'interiorPaint', area: Number(property.interiorArea) || 0, label: 'Interior Paint', type: 'Paint' },
      { key: 'exteriorPaint', area: Number(property.exteriorArea) || 0, label: 'Exterior Paint', type: 'Paint' },
      { key: 'ceilingPaint', area: Number(property.ceilingArea) || 0, label: 'Ceiling Paint', type: 'Paint' },
      { key: 'balconyPaint', area: Number(property.balconyArea) || 0, label: 'Balcony Paint', type: 'Paint' },
      { key: 'interiorPrimer', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0), label: 'Interior Primer', type: 'Primer' },
      { key: 'exteriorPrimer', area: (Number(property.exteriorArea) || 0) + (Number(property.balconyArea) || 0), label: 'Exterior Primer', type: 'Primer' },
      { key: 'interiorPutty', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0), label: 'Interior Putty', type: 'Putty' },
      { key: 'exteriorPutty', area: (Number(property.exteriorArea) || 0) + (Number(property.balconyArea) || 0), label: 'Exterior Putty', type: 'Putty' }
    ];

    const paintBuf = settingsSnapshot?.paintBuffer !== undefined ? Number(settingsSnapshot.paintBuffer) : 10;
    const primerBuf = settingsSnapshot?.primerBuffer !== undefined ? Number(settingsSnapshot.primerBuffer) : 10;
    const puttyBuf = settingsSnapshot?.puttyBuffer !== undefined ? Number(settingsSnapshot.puttyBuffer) : 10;
    const wastage = settingsSnapshot?.wastagePercent !== undefined ? Number(settingsSnapshot.wastagePercent) : 5;
    const rounding = settingsSnapshot?.roundingMethod || 'ROUND_UP';

    productMappings.forEach(mapping => {
      const selection = selectedProducts[mapping.key];
      if (selection?.productId && mapping.area > 0) {
        const prod = productsList.find(p => p._id === selection.productId);
        if (prod) {
          const coverage = prod.coverage?.value || 1;
          const price = prod.price || 0;

          let bufferPercent = 0;
          if (mapping.type === 'Paint') bufferPercent = paintBuf;
          else if (mapping.type === 'Primer') bufferPercent = primerBuf;
          else if (mapping.type === 'Putty') bufferPercent = puttyBuf;

          const finalAreaWithBuffer = mapping.area * (1 + bufferPercent / 100);

          // Get manual coats from selection
          const coatsCount = selection.coats !== undefined ? Number(selection.coats) : (mapping.type === 'Primer' ? 1 : 2);

          const quantityRequired = parseFloat(((finalAreaWithBuffer * coatsCount) / coverage).toFixed(2));
          
          // Calculate optimal pack size combination to fulfill the required quantity
          const packBreakdown = getOptimalPacks(quantityRequired, prod.availablePackSizes);
          const totalVolumePurchased = packBreakdown.reduce((sum, p) => sum + (p.size * p.count), 0);
          const quantityPurchased = packBreakdown.reduce((sum, p) => sum + p.count, 0);

          // Subtotal is calculated dynamically based on total volume of purchased packs
          const subtotal = parseFloat((totalVolumePurchased * price).toFixed(2));

          materialCost += subtotal;
          selectedProductDetails.push({
            label: mapping.label,
            productName: prod.productName,
            productCode: prod.productCode,
            productType: prod.productType,
            coverage,
            unitPrice: price,
            selectedPackSize: selection.selectedPackSize,
            quantityRequired,
            quantityPurchased,
            packBreakdown,
            subtotal,
            appliedArea: mapping.area,
            coats: coatsCount
          });
        }
      }
    });

    // Fetch dynamic coat multipliers from settings snapshot
    const multipliers = settingsSnapshot?.laborCoatMultipliers || { '1': 0.6, '2': 1.0, '3': 1.3, '4': 1.6 };
    const getMultiplier = (c) => {
      const key = String(c);
      return multipliers[key] !== undefined ? Number(multipliers[key]) : (c === 1 ? 0.6 : c === 2 ? 1.0 : c === 3 ? 1.3 : 1.6);
    };

    // Labour mapping
    const labourMappings = [
      { key: 'interiorLabour', label: 'Interior Labour', application: 'INTERIOR' },
      { key: 'exteriorLabour', label: 'Exterior Labour', application: 'EXTERIOR' }
    ];

    labourMappings.forEach(mapping => {
      const lId = selectedLabour[mapping.key];
      const area = mapping.application === 'INTERIOR'
        ? (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0) + (Number(property.balconyArea) || 0)
        : (Number(property.exteriorArea) || 0);

      if (lId && area > 0) {
        const rate = labourRatesList.find(r => r._id === lId);
        if (rate) {
          let subtotal = 0;
          if (mapping.application === 'INTERIOR') {
            const intArea = Number(property.interiorArea) || 0;
            const ceilArea = Number(property.ceilingArea) || 0;
            const balcArea = Number(property.balconyArea) || 0;

            const intMult = getMultiplier(selectedProducts.interiorPaint.coats || 2);
            const ceilMult = getMultiplier(selectedProducts.ceilingPaint.coats || 2);
            const balcMult = getMultiplier(selectedProducts.balconyPaint.coats || 2);

            subtotal = parseFloat((
              (intArea * rate.pricePerSqft * intMult) +
              (ceilArea * rate.pricePerSqft * ceilMult) +
              (balcArea * rate.pricePerSqft * balcMult)
            ).toFixed(2));
          } else {
            // EXTERIOR
            const extArea = Number(property.exteriorArea) || 0;
            const extMult = getMultiplier(selectedProducts.exteriorPaint.coats || 2);

            subtotal = parseFloat((extArea * rate.pricePerSqft * extMult).toFixed(2));
          }

          labourCost += subtotal;
          selectedLabourDetails.push({
            label: mapping.label,
            workType: rate.workType,
            pricePerSqFt: rate.pricePerSqft,
            area,
            subtotal
          });
        }
      }
    });

    // Additional charges cost
    additionalCharges.forEach(c => {
      additionalCost += Number(c.amount) || 0;
    });

    const baseSum = materialCost + labourCost + additionalCost;
    let discountVal = 0;
    if (discount.type === 'PERCENTAGE') {
      discountVal = parseFloat((baseSum * (discount.value / 100)).toFixed(2));
    } else if (discount.type === 'FLAT') {
      discountVal = Math.min(baseSum, discount.value);
    }

    const taxableAmount = Math.max(0, baseSum - discountVal);
    const gstPct = settingsSnapshot?.gstPercentage !== undefined ? Number(settingsSnapshot.gstPercentage) : 18;
    const gstVal = parseFloat((taxableAmount * (gstPct / 100)).toFixed(2));
    const grandTotal = parseFloat((taxableAmount + gstVal).toFixed(2));

    return {
      materialCost: parseFloat(materialCost.toFixed(2)),
      labourCost: parseFloat(labourCost.toFixed(2)),
      additionalCharges: parseFloat(additionalCost.toFixed(2)),
      discount: parseFloat(discountVal.toFixed(2)),
      gst: parseFloat(gstVal.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      products: selectedProductDetails,
      labour: selectedLabourDetails
    };
  };

  const calculated = calculateCosts();

  // Navigation handlers
  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => {
    if (step === 0) {
      onBack();
    } else {
      setStep(s => s - 1);
    }
  };

  // Compile full quotation payload for backend save/update
  const getPayload = () => {
    const productsPayload = [];
    const productKeys = [
      { key: 'interiorPaint', area: Number(property.interiorArea) || 0 },
      { key: 'exteriorPaint', area: Number(property.exteriorArea) || 0 },
      { key: 'ceilingPaint', area: Number(property.ceilingArea) || 0 },
      { key: 'balconyPaint', area: Number(property.balconyArea) || 0 },
      { key: 'interiorPrimer', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0) },
      { key: 'exteriorPrimer', area: (Number(property.exteriorArea) || 0) + (Number(property.balconyArea) || 0) },
      { key: 'interiorPutty', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0) },
      { key: 'exteriorPutty', area: (Number(property.exteriorArea) || 0) + (Number(property.balconyArea) || 0) }
    ];

    productKeys.forEach(p => {
      const selection = selectedProducts[p.key];
      if (selection?.productId && p.area > 0) {
        productsPayload.push({
          productId: selection.productId,
          selectedPackSize: selection.selectedPackSize,
          appliedArea: p.area,
          coats: selection.coats !== undefined ? Number(selection.coats) : undefined
        });
      }
    });

    const labourPayload = [];
    if (selectedLabour.interiorLabour && (Number(property.interiorArea) + Number(property.ceilingArea) + Number(property.balconyArea)) > 0) {
      labourPayload.push({
        labourRateId: selectedLabour.interiorLabour,
        area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0) + (Number(property.balconyArea) || 0)
      });
    }
    if (selectedLabour.exteriorLabour && Number(property.exteriorArea) > 0) {
      labourPayload.push({
        labourRateId: selectedLabour.exteriorLabour,
        area: Number(property.exteriorArea) || 0
      });
    }

    return {
      consultationId: consultation?._id,
      property,
      rooms: rooms.map(r => {
        const bk = calculateRoomAreas(r);
        return {
          name: r.name,
          roomCode: r.roomCode || 'CUSTOM',
          sqft: bk.netPaintableArea,
          ceiling: {
            included: r.paintCeiling,
            length: Number(r.length),
            width: Number(r.width)
          },
          measurementMode: r.measurementMode || 'DIMENSIONS',
          roomProgress: r.roomProgress || 100,
          walls: r.measurementMode === 'WALLS' ? (r.walls || []).map(w => ({
            name: w.name,
            width: Number(w.width),
            height: Number(w.height),
            thickness: Number(w.thickness) || 0,
            wallType: w.wallType || 'Standard',
            material: w.material || 'Concrete',
            condition: w.condition || 'Good',
            openings: (w.openings || []).map(o => ({
              type: o.type,
              width: Number(o.width),
              height: Number(o.height),
              paint: o.paint,
              frameMaterial: o.frameMaterial || '',
              remarks: o.remarks || ''
            }))
          })) : [{
            name: 'Generated Group',
            width: Number(r.width),
            height: Number(r.height),
            openings: []
          }],
          paintItems: (r.paintItems || []).map(pi => ({
            name: pi.name,
            quantity: Number(pi.quantity) || 1,
            unitArea: Number(pi.unitArea) || 0,
            totalArea: (Number(pi.quantity) || 1) * (Number(pi.unitArea) || 0),
            itemType: pi.itemType || 'Custom'
          })),
          calculationBreakdown: bk,
          vendorOverride: r.vendorOverride || { overrideActive: false, manualArea: 0, reason: '', photoEvidence: [] },
          photos: r.photos || { before: [], damage: [], reference: [], after: [], video: '' }
        };
      }),
      products: productsPayload,
      labour: labourPayload,
      additionalCharges,
      discount,
      gstPercentage: 18,
      remarks,
      attachments
    };
  };

  // Save quotation draft (autosaves when navigating or manually clicked)
  const handleSaveDraft = async (silent = false) => {
    if (isReadOnly) return null;
    try {
      const payload = getPayload();
      let res;
      if (quoteId) {
        res = await updateQuotationDraft(quoteId, payload);
        if (!silent) {
          toast.success('Draft quotation saved successfully!');
        }
        return quoteId;
      } else {
        res = await saveQuotationDraft(payload);
        if (res?.success && res.data?._id) {
          setQuoteId(res.data._id);
          if (!silent) {
            toast.success('Draft quotation saved successfully!');
          }
          return res.data._id;
        }
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        toast.error('Failed to save draft quotation.');
      }
    }
    return null;
  };

  // Submit to Admin
  const handleSubmitToAdmin = async () => {
    let currentQuoteId = quoteId;
    if (!currentQuoteId) {
      // Create first
      currentQuoteId = await handleSaveDraft(true);
      if (!currentQuoteId) {
        toast.error('Failed to save draft quotation before submitting.');
        return;
      }
    }
    try {
      setSubmitting(true);
      const res = await submitQuotationToAdmin(currentQuoteId);
      if (res?.success) {
        toast.success('🚀 Quotation submitted to Admin for review!');
        setIsReadOnly(true);
        setCurrentStatus('SUBMITTED_TO_ADMIN');
        if (onComplete) onComplete();
      } else {
        toast.error(res?.message || 'Failed to submit quote');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting quotation to Admin.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle local mock image file upload
  const handleMockUpload = (field, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(prev => ({ ...prev, [field]: true }));

    // Mock network lag
    setTimeout(() => {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        // Create mock URL or object URL
        urls.push(URL.createObjectURL(files[i]));
      }

      setAttachments(prev => ({
        ...prev,
        [field]: [...prev[field], ...urls]
      }));
      setUploading(prev => ({ ...prev, [field]: false }));
      toast.success(`Uploaded ${files.length} photo(s)`);
    }, 1500);
  };

  const handleRemoveAttachment = (field, idx) => {
    setAttachments(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Loading Wizard Config...</p>
        </div>
      </div>
    );
  }

  // Filter products by selected brand and productType
  const getFilteredProducts = (type) => {
    return productsList.filter(p => p.brandId?._id === selectedBrand && p.productType === type);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">

      {/* Header bar */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-150 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-95 text-gray-500 hover:text-orange-500">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                Quotation Builder
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${currentStatus === 'DRAFT' ? 'bg-orange-100 text-orange-600' :
                    currentStatus === 'SUBMITTED_TO_ADMIN' ? 'bg-blue-100 text-blue-600' :
                      'bg-green-100 text-green-600'
                  }`}>
                  {currentStatus}
                </span>
              </h1>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                {consultation?.userId?.name || 'Customer'} • {property.propertyType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                onClick={() => handleSaveDraft(false)}
                className="text-xs font-bold text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-xl transition-all border border-orange-200"
              >
                Save Draft
              </button>
            )}
            <span className="text-xs font-extrabold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
        </div>

        {/* Step Indicator Progress bar */}
        <div className="flex items-center gap-1.5 max-w-4xl mx-auto mt-4 px-1">
          {STEPS.map((s, idx) => (
            <div key={idx} className="flex-1 min-w-0 flex flex-col items-center relative cursor-pointer text-center" onClick={() => setStep(idx)}>
              <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${idx < step ? 'bg-orange-500' : idx === step ? 'bg-orange-400 scale-y-125 shadow-md shadow-orange-200' : 'bg-gray-200'
                }`} />
              <span className={`text-[9px] mt-2 font-bold uppercase tracking-wider transition-colors duration-250 text-center w-full block whitespace-normal ${idx === step ? 'text-orange-500' : 'text-gray-400'
                } hidden md:block`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main wizard content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {isReadOnly && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex gap-3 text-amber-800">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Read-Only Quotation</p>
              <p className="text-xs opacity-90 mt-0.5">This quotation was submitted to the Admin on {new Date(consultation?.updatedAt).toLocaleDateString()} and is locked. Edits are disabled.</p>
            </div>
          </div>
        )}

        {remarks?.adminRemarks && (
          <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl flex gap-3 text-purple-800">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-purple-950">Feedback from Admin</p>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{remarks.adminRemarks}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-xl shadow-gray-100/50">

          {/* Step 1: Property Summary */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                    <span>🏠</span> Step 1: Room-Based Inspection Wizard
                  </h2>
                  <p className="text-xs text-gray-400 font-semibold mt-1">Review, add, and measure rooms to compute paintable areas automatically.</p>
                </div>

                <div className="flex flex-col gap-1 w-44">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Property Layout</label>
                  <select
                    disabled={isReadOnly}
                    value={property.propertyType}
                    onChange={async (e) => {
                      const newType = e.target.value;
                      setProperty(prev => ({ ...prev, propertyType: newType }));
                      // Auto rebuild rooms from matched template list
                      const matchTmpl = templatesList?.find(t => t.code === newType);
                      if (matchTmpl && matchTmpl.rooms) {
                        setRooms(matchTmpl.rooms.map(r => ({
                          name: r.name,
                          roomCode: r.roomCode,
                          length: 12,
                          width: 10,
                          height: 10,
                          doorsCount: 1,
                          windowsCount: 1,
                          paintCeiling: r.features?.find(f => f.featureCode === 'SUPPORTS_CEILING')?.enabled || false,
                          paintWalls: true,
                          paintDoors: false,
                          paintWindows: false,
                          paintGrills: false
                        })));
                        toast.success(`Loaded template blueprint for ${matchTmpl.name}`);
                      }
                    }}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-white text-gray-700 outline-none cursor-pointer"
                  >
                    {templatesList.map(t => (
                      <option key={t.code} value={t.code}>{t.name}</option>
                    ))}
                    <option value="CUSTOM">Custom Layout</option>
                  </select>
                </div>
              </div>

              {/* Room Cards List */}
              <div className="space-y-3.5">
                {rooms.map((room, idx) => {
                  const isExpanded = expandedRoomIdx === idx;
                  const bk = calculateRoomAreas(room);
                  const wArea = bk.netPaintableArea - (room.paintCeiling ? bk.ceilingArea : 0);
                  const flArea = bk.ceilingArea || (Number(room.length) * Number(room.width));

                  return (
                    <div key={idx} className="border-2 border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-orange-300">
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedRoomIdx(isExpanded ? null : idx)}
                        className="p-4 bg-gray-50/70 hover:bg-gray-100/50 flex justify-between items-center cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-bold font-mono">#{idx + 1}</span>
                          <span className="font-extrabold text-sm text-gray-800">{room.name}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white border px-1.5 py-0.5 rounded">
                            {room.roomCode}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                          <span>Ceiling: <strong className="text-gray-700">{room.paintCeiling ? `${flArea} sqft` : 'N/A'}</strong></span>
                          <span>Walls: <strong className="text-gray-700">{room.paintWalls ? `${wArea} sqft` : 'N/A'}</strong></span>
                          <span className="text-gray-400">➔</span>
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="p-6 border-t border-gray-100 bg-white space-y-6 text-xs text-gray-700">

                          {/* Top Section: Progress & Mode Switcher */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/70 p-4 rounded-2xl border border-gray-150">
                            <div>
                              <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                                <span>📐</span> Inspection Workspace
                              </h3>
                              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Configure room walls, custom deductions, and surface conditions.</p>
                            </div>

                            {/* Mode Picker */}
                            <div className="flex items-center bg-gray-200/50 p-1 rounded-xl gap-1">
                              {['DIMENSIONS', 'WALLS', 'MANUAL'].map(mode => (
                                <button
                                  key={mode}
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={() => {
                                    const updated = [...rooms];
                                    updated[idx].measurementMode = mode;
                                    setRooms(updated);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${room.measurementMode === mode
                                      ? 'bg-white text-orange-500 shadow-sm'
                                      : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                  {mode === 'DIMENSIONS' ? 'Dimensions' : mode === 'WALLS' ? 'Walls' : 'Manual Net'}
                                </button>
                              ))}
                            </div>

                            {/* Progress Indicator */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inspection Progress:</span>
                              <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full transition-all" style={{ width: `${getRoomProgress(room)}%` }} />
                              </div>
                              <span className="text-[10px] font-extrabold text-orange-600">{getRoomProgress(room)}% Complete</span>
                            </div>
                          </div>

                          {/* Main Work Area: Left (Form inputs) and Right (Live Summary + Floor plan) */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                            {/* LEFT SIDE: Inputs Form */}
                            <div className="lg:col-span-2 space-y-6">

                              {/* Option A: Room Dimension Mode */}
                              {room.measurementMode === 'DIMENSIONS' && (
                                <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-4">
                                  <h4 className="font-extrabold text-gray-800 border-b pb-2 flex items-center gap-1.5">
                                    <span>📦</span> Room Box Dimensions
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                    <div className="flex flex-col gap-1 font-bold">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Length (ft)</label>
                                      <input
                                        disabled={isReadOnly}
                                        type="number"
                                        value={room.length}
                                        onChange={e => {
                                          const updated = [...rooms];
                                          updated[idx].length = Number(e.target.value) || 0;
                                          setRooms(updated);
                                        }}
                                        className="border border-gray-200 rounded-xl p-2.5 outline-none focus:border-orange-400 text-center font-bold"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1 font-bold">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Width (ft)</label>
                                      <input
                                        disabled={isReadOnly}
                                        type="number"
                                        value={room.width}
                                        onChange={e => {
                                          const updated = [...rooms];
                                          updated[idx].width = Number(e.target.value) || 0;
                                          setRooms(updated);
                                        }}
                                        className="border border-gray-200 rounded-xl p-2.5 text-center font-bold"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1 font-bold">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Height (ft)</label>
                                      <input
                                        disabled={isReadOnly}
                                        type="number"
                                        value={room.height}
                                        onChange={e => {
                                          const updated = [...rooms];
                                          updated[idx].height = Number(e.target.value) || 0;
                                          setRooms(updated);
                                        }}
                                        className="border border-gray-200 rounded-xl p-2.5 text-center font-bold"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Option B: Individual Wall Mode */}
                              {room.measurementMode === 'WALLS' && (
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center bg-white border border-gray-150 rounded-2xl p-4">
                                    <div>
                                      <h4 className="font-extrabold text-gray-800 flex items-center gap-1.5">
                                        <span>🧱</span> Dynamic Wall segments list
                                      </h4>
                                      <p className="text-[10px] text-gray-400 mt-0.5">Add walls to match complex shapes (L-shaped, halls, alcoves).</p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={isReadOnly}
                                      onClick={() => {
                                        const updated = [...rooms];
                                        const nextNum = (updated[idx].walls?.length || 0) + 1;
                                        if (!updated[idx].walls) updated[idx].walls = [];
                                        updated[idx].walls.push({
                                          name: `Wall ${nextNum}`,
                                          width: 12,
                                          height: Number(room.height) || 10,
                                          thickness: 0,
                                          wallType: 'Standard',
                                          material: 'Concrete',
                                          condition: 'Good',
                                          openings: []
                                        });
                                        setRooms(updated);
                                        toast.success(`Added Wall ${nextNum} at the bottom of the list!`);
                                      }}
                                      className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all"
                                    >
                                      <FiPlus className="w-3.5 h-3.5" /> Add Wall
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    {(room.walls || []).map((wall, wIdx) => (
                                      <div key={wIdx} className="bg-white border border-gray-150 rounded-2xl p-4 space-y-3 shadow-sm relative">
                                        {/* Wall Header */}
                                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-700">{wall.name}</span>
                                            <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                                              Gross: {(Number(wall.width) || 0) * (Number(wall.height) || 0)} sqft
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => {
                                              const updated = [...rooms];
                                              updated[idx].walls = updated[idx].walls.filter((_, i) => i !== wIdx);
                                              setRooms(updated);
                                            }}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-55 p-1.5 rounded-lg transition-all"
                                          >
                                            <FiTrash2 className="w-4 h-4" />
                                          </button>
                                        </div>

                                        {/* Dimensions and Attributes */}
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                                          <div className="flex flex-col gap-0.5 font-bold">
                                            <label className="text-[8px] text-gray-400 uppercase tracking-wider">Name</label>
                                            <input
                                              disabled={isReadOnly}
                                              type="text"
                                              value={wall.name}
                                              onChange={e => {
                                                const updated = [...rooms];
                                                updated[idx].walls[wIdx].name = e.target.value;
                                                setRooms(updated);
                                              }}
                                              className="border border-gray-150 rounded-lg p-1.5 outline-none font-bold"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-0.5 font-bold">
                                            <label className="text-[8px] text-gray-400 uppercase tracking-wider">Length (ft)</label>
                                            <input
                                              disabled={isReadOnly}
                                              type="number"
                                              value={wall.width}
                                              onChange={e => {
                                                const updated = [...rooms];
                                                updated[idx].walls[wIdx].width = Number(e.target.value) || 0;
                                                setRooms(updated);
                                              }}
                                              className="border border-gray-150 rounded-lg p-1.5 text-center font-bold"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-0.5 font-bold">
                                            <label className="text-[8px] text-gray-400 uppercase tracking-wider">Height (ft)</label>
                                            <input
                                              disabled={isReadOnly}
                                              type="number"
                                              value={wall.height}
                                              onChange={e => {
                                                const updated = [...rooms];
                                                updated[idx].walls[wIdx].height = Number(e.target.value) || 0;
                                                setRooms(updated);
                                              }}
                                              className="border border-gray-150 rounded-lg p-1.5 text-center font-bold"
                                            />
                                          </div>
                                          <div className="flex flex-col gap-0.5 font-bold">
                                            <label className="text-[8px] text-gray-400 uppercase tracking-wider">Wall Type</label>
                                            <select
                                              disabled={isReadOnly}
                                              value={wall.wallType || 'Standard'}
                                              onChange={e => {
                                                const updated = [...rooms];
                                                updated[idx].walls[wIdx].wallType = e.target.value;
                                                setRooms(updated);
                                              }}
                                              className="border border-gray-150 rounded-lg p-1.5 bg-white text-gray-700 outline-none font-bold"
                                            >
                                              {WALL_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="flex flex-col gap-0.5 font-bold">
                                            <label className="text-[8px] text-gray-400 uppercase tracking-wider">Condition</label>
                                            <select
                                              disabled={isReadOnly}
                                              value={wall.condition || 'Good'}
                                              onChange={e => {
                                                const updated = [...rooms];
                                                updated[idx].walls[wIdx].condition = e.target.value;
                                                setRooms(updated);
                                              }}
                                              className="border border-gray-150 rounded-lg p-1.5 bg-white text-gray-700 outline-none font-bold"
                                            >
                                              {WALL_CONDITIONS.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>

                                        {/* Openings list */}
                                        <div className="border-t pt-2 mt-2 space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Deductions / Openings</span>
                                            <button
                                              type="button"
                                              disabled={isReadOnly}
                                              onClick={() => {
                                                const updated = [...rooms];
                                                if (!updated[idx].walls[wIdx].openings) updated[idx].walls[wIdx].openings = [];
                                                updated[idx].walls[wIdx].openings.push({
                                                  type: 'Door', width: 3, height: 7, paint: false, frameMaterial: 'Wood', remarks: ''
                                                });
                                                setRooms(updated);
                                                toast.success("Added opening/deduction segment at the bottom!");
                                              }}
                                              className="text-[9px] font-black text-orange-500 hover:bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 flex items-center gap-1"
                                            >
                                              <FiPlus /> Add Opening
                                            </button>
                                          </div>

                                          {(wall.openings && wall.openings.length > 0) && (
                                            <div className="space-y-1.5">
                                              {wall.openings.map((op, opIdx) => (
                                                <div key={opIdx} className="flex flex-wrap items-center gap-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                                  {/* Type dropdown */}
                                                  <select
                                                    disabled={isReadOnly}
                                                    value={op.type || 'Door'}
                                                    onChange={e => {
                                                      const updated = [...rooms];
                                                      updated[idx].walls[wIdx].openings[opIdx].type = e.target.value;
                                                      setRooms(updated);
                                                    }}
                                                    className="border border-gray-150 rounded-lg p-1 bg-white text-gray-700 outline-none text-[10px] font-bold shrink-0"
                                                    style={{ minWidth: '80px' }}
                                                  >
                                                    {OPENING_TYPES.map(ot => (
                                                      <option key={ot} value={ot}>{ot}</option>
                                                    ))}
                                                  </select>

                                                  {/* W × H inputs — kept as a single group */}
                                                  <div className="flex items-center gap-1 shrink-0">
                                                    <input
                                                      disabled={isReadOnly}
                                                      type="number"
                                                      value={op.width || ''}
                                                      placeholder="W"
                                                      onChange={e => {
                                                        const updated = [...rooms];
                                                        updated[idx].walls[wIdx].openings[opIdx].width = Number(e.target.value) || 0;
                                                        setRooms(updated);
                                                      }}
                                                      className="border border-gray-300 rounded-lg p-1.5 text-center w-12 text-[10px] font-bold text-gray-800 bg-white"
                                                    />
                                                    <span className="text-[9px] font-black text-gray-400 shrink-0">×</span>
                                                    <input
                                                      disabled={isReadOnly}
                                                      type="number"
                                                      value={op.height || ''}
                                                      placeholder="H"
                                                      onChange={e => {
                                                        const updated = [...rooms];
                                                        updated[idx].walls[wIdx].openings[opIdx].height = Number(e.target.value) || 0;
                                                        setRooms(updated);
                                                      }}
                                                      className="border border-gray-300 rounded-lg p-1.5 text-center w-12 text-[10px] font-bold text-gray-800 bg-white"
                                                    />
                                                  </div>

                                                  {/* Paint? checkbox */}
                                                  <label className="flex items-center gap-1 select-none cursor-pointer shrink-0">
                                                    <input
                                                      disabled={isReadOnly}
                                                      type="checkbox"
                                                      checked={op.paint}
                                                      onChange={() => {
                                                        const updated = [...rooms];
                                                        updated[idx].walls[wIdx].openings[opIdx].paint = !op.paint;
                                                        setRooms(updated);
                                                      }}
                                                      className="rounded text-orange-500 border-gray-200 w-3.5 h-3.5"
                                                    />
                                                    <span className="text-[9px] font-bold text-gray-600">Paint?</span>
                                                  </label>

                                                  {/* Material */}
                                                  <input
                                                    disabled={isReadOnly}
                                                    type="text"
                                                    placeholder="Material"
                                                    value={op.frameMaterial || ''}
                                                    onChange={e => {
                                                      const updated = [...rooms];
                                                      updated[idx].walls[wIdx].openings[opIdx].frameMaterial = e.target.value;
                                                      setRooms(updated);
                                                    }}
                                                    className="border border-gray-150 rounded-lg p-1 text-[10px] min-w-[70px] flex-1"
                                                  />

                                                  {/* Remarks */}
                                                  <input
                                                    disabled={isReadOnly}
                                                    type="text"
                                                    placeholder="Remarks"
                                                    value={op.remarks || ''}
                                                    onChange={e => {
                                                      const updated = [...rooms];
                                                      updated[idx].walls[wIdx].openings[opIdx].remarks = e.target.value;
                                                      setRooms(updated);
                                                    }}
                                                    className="border border-gray-150 rounded-lg p-1 text-[10px] min-w-[70px] flex-1"
                                                  />

                                                  {/* Delete */}
                                                  <button
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => {
                                                      const updated = [...rooms];
                                                      updated[idx].walls[wIdx].openings = updated[idx].walls[wIdx].openings.filter((_, i) => i !== opIdx);
                                                      setRooms(updated);
                                                    }}
                                                    className="text-red-400 hover:text-red-600 text-[10px] font-black transition-all shrink-0 ml-auto"
                                                  >
                                                    Delete
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* Inline warnings validation */}
                                        {(() => {
                                          const gross = (Number(wall.width) || 0) * (Number(wall.height) || 0);
                                          const opsArea = (wall.openings || []).reduce((acc, o) => acc + (Number(o.width) * Number(o.height)), 0);
                                          if (opsArea > gross) {
                                            return (
                                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 p-2 rounded-xl mt-2 border border-red-105">
                                                <FiAlertCircle className="w-4.5 h-4.5 shrink-0" />
                                                <span>Opening area ({opsArea} sqft) cannot exceed gross wall area ({gross} sqft).</span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Option C: Manual Paintable Area Mode */}
                              {room.measurementMode === 'MANUAL' && (
                                <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-3">
                                  <h4 className="font-extrabold text-gray-800 flex items-center gap-1.5">
                                    <span>✍️</span> Direct Manual Paintable Area override
                                  </h4>
                                  <p className="text-[10px] text-gray-400">Perfect for flat estimations or audited commercial requirements.</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1 font-bold">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Manual Area (sqft)</label>
                                      <input
                                        disabled={isReadOnly}
                                        type="number"
                                        value={room.vendorOverride?.manualArea || 0}
                                        onChange={e => {
                                          const updated = [...rooms];
                                          if (!updated[idx].vendorOverride) updated[idx].vendorOverride = {};
                                          updated[idx].vendorOverride.manualArea = Number(e.target.value) || 0;
                                          updated[idx].vendorOverride.overrideActive = true;
                                          setRooms(updated);
                                        }}
                                        className="border border-gray-250 rounded-xl p-2.5 text-center font-bold text-sm text-orange-650 focus:border-orange-500 outline-none"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1 font-bold">
                                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reason for override</label>
                                      <input
                                        disabled={isReadOnly}
                                        type="text"
                                        placeholder="e.g. Blueprints override"
                                        value={room.vendorOverride?.reason || ''}
                                        onChange={e => {
                                          const updated = [...rooms];
                                          if (!updated[idx].vendorOverride) updated[idx].vendorOverride = {};
                                          updated[idx].vendorOverride.reason = e.target.value;
                                          setRooms(updated);
                                        }}
                                        className="border border-gray-250 rounded-xl p-2.5 outline-none focus:border-orange-400"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Section: Room-Specific Parameters */}
                              {room.measurementMode === 'DIMENSIONS' && (
                                <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-4">
                                  <h4 className="font-extrabold text-gray-800 flex items-center gap-1.5 border-b pb-2">
                                    <span>⚙️</span> Room-Specific Parameters
                                  </h4>

                                  {/* Kitchen Specific */}
                                  {room.roomCode === 'KITCHEN' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Cabinet Width (ft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.kitchenExtras?.cabinetWidth || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].kitchenExtras) updated[idx].kitchenExtras = {};
                                            updated[idx].kitchenExtras.cabinetWidth = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Cabinet Height (ft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.kitchenExtras?.cabinetHeight || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].kitchenExtras) updated[idx].kitchenExtras = {};
                                            updated[idx].kitchenExtras.cabinetHeight = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Backsplash Tiling Height (ft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.kitchenExtras?.backsplashHeight || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].kitchenExtras) updated[idx].kitchenExtras = {};
                                            updated[idx].kitchenExtras.backsplashHeight = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Bathroom Specific */}
                                  {room.roomCode === 'BATHROOM' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Tile Height (ft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.bathroomExtras?.tileHeight || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].bathroomExtras) updated[idx].bathroomExtras = {};
                                            updated[idx].bathroomExtras.tileHeight = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Ventilator Width (ft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.bathroomExtras?.ventilatorWidth || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].bathroomExtras) updated[idx].bathroomExtras = {};
                                            updated[idx].bathroomExtras.ventilatorWidth = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Ventilator Height (ft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.bathroomExtras?.ventilatorHeight || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].bathroomExtras) updated[idx].bathroomExtras = {};
                                            updated[idx].bathroomExtras.ventilatorHeight = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Mirror Area (sqft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.bathroomExtras?.mirrorArea || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].bathroomExtras) updated[idx].bathroomExtras = {};
                                            updated[idx].bathroomExtras.mirrorArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Living Room Specific */}
                                  {room.roomCode === 'LIVING_ROOM' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Feature Wall (sqft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.livingRoomExtras?.featureWallArea || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].livingRoomExtras) updated[idx].livingRoomExtras = {};
                                            updated[idx].livingRoomExtras.featureWallArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Texture Wall (sqft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.livingRoomExtras?.textureWallArea || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].livingRoomExtras) updated[idx].livingRoomExtras = {};
                                            updated[idx].livingRoomExtras.textureWallArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">TV Panel Area (sqft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.livingRoomExtras?.tvPanelArea || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].livingRoomExtras) updated[idx].livingRoomExtras = {};
                                            updated[idx].livingRoomExtras.tvPanelArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Wood Panel (sqft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.livingRoomExtras?.woodPanelArea || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].livingRoomExtras) updated[idx].livingRoomExtras = {};
                                            updated[idx].livingRoomExtras.woodPanelArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Wallpaper Area (sqft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.livingRoomExtras?.wallpaperArea || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].livingRoomExtras) updated[idx].livingRoomExtras = {};
                                            updated[idx].livingRoomExtras.wallpaperArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Balcony Specific */}
                                  {room.roomCode === 'BALCONY' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Railing Length (ft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.balconyExtras?.railingLength || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].balconyExtras) updated[idx].balconyExtras = {};
                                            updated[idx].balconyExtras.railingLength = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Grill Area (sqft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.balconyExtras?.grillArea || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].balconyExtras) updated[idx].balconyExtras = {};
                                            updated[idx].balconyExtras.grillArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Exterior Specific */}
                                  {room.roomCode === 'EXTERIOR' && (
                                    <div className="grid grid-cols-1 gap-3.5">
                                      <div className="flex flex-col gap-1 font-bold">
                                        <label className="text-[8px] text-gray-400 uppercase tracking-wider">Parapet Wall Area (sqft)</label>
                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          value={room.exteriorExtras?.parapetWallArea || 0}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            if (!updated[idx].exteriorExtras) updated[idx].exteriorExtras = {};
                                            updated[idx].exteriorExtras.parapetWallArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-200 rounded-lg p-2 text-center"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Section: Additional Paintable Objects */}
                              <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-extrabold text-gray-800 flex items-center gap-1.5">
                                    <span>🪟</span> Additional Paintable Items
                                  </h4>
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => {
                                      const updated = [...rooms];
                                      if (!updated[idx].paintItems) updated[idx].paintItems = [];
                                      updated[idx].paintItems.push({
                                        name: 'Door', quantity: 1, unitArea: 21, totalArea: 21, itemType: 'Custom'
                                      });
                                      setRooms(updated);
                                    }}
                                    className="text-[9px] font-black text-orange-500 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 flex items-center gap-1 transition-all"
                                  >
                                    <FiPlus /> Add Item
                                  </button>
                                </div>

                                {(room.paintItems && room.paintItems.length > 0) ? (
                                  <div className="space-y-1.5">
                                    {room.paintItems.map((item, itemIdx) => (
                                      <div key={itemIdx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 items-center">
                                        <select
                                          disabled={isReadOnly}
                                          value={item.name || 'Door'}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            updated[idx].paintItems[itemIdx].name = e.target.value;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-150 rounded-lg p-1.5 bg-white text-gray-700 outline-none text-[10px] font-bold"
                                        >
                                          {PAINTABLE_OBJECTS.map(po => (
                                            <option key={po} value={po}>{po}</option>
                                          ))}
                                        </select>

                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          placeholder="Quantity"
                                          value={item.quantity}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            updated[idx].paintItems[itemIdx].quantity = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-150 rounded-lg p-1.5 text-center text-[10px] font-bold"
                                        />

                                        <input
                                          disabled={isReadOnly}
                                          type="number"
                                          placeholder="Unit Area (sqft)"
                                          value={item.unitArea}
                                          onChange={e => {
                                            const updated = [...rooms];
                                            updated[idx].paintItems[itemIdx].unitArea = Number(e.target.value) || 0;
                                            setRooms(updated);
                                          }}
                                          className="border border-gray-150 rounded-lg p-1.5 text-center text-[10px] font-bold"
                                        />

                                        <div className="flex justify-between items-center">
                                          <span className="font-extrabold text-[10px] text-gray-500">
                                            Total: {(Number(item.quantity) || 1) * (Number(item.unitArea) || 0)} sqft
                                          </span>
                                          <button
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => {
                                              const updated = [...rooms];
                                              updated[idx].paintItems = updated[idx].paintItems.filter((_, i) => i !== itemIdx);
                                              setRooms(updated);
                                            }}
                                            className="text-red-500 hover:text-red-700 font-bold p-1 rounded transition-all"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-400 italic">No extra custom items added yet.</p>
                                )}
                              </div>

                              {/* Section: Photos Upload Checklist */}
                              <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-3">
                                <h4 className="font-extrabold text-gray-800 flex items-center gap-1.5">
                                  <span>📸</span> Site Visual Evidence
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="border border-dashed border-gray-205 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 bg-gray-50/50 cursor-pointer">
                                    <FiUploadCloud className="w-6 h-6 text-gray-400" />
                                    <span className="font-bold text-[10px] text-gray-600">Before Work Photos</span>
                                    <span className="text-[8px] text-gray-400">Click to upload / mock</span>
                                  </div>
                                  <div className="border border-dashed border-gray-205 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 bg-gray-50/50 cursor-pointer">
                                    <FiUploadCloud className="w-6 h-6 text-gray-400" />
                                    <span className="font-bold text-[10px] text-gray-600">Damage Closeups</span>
                                    <span className="text-[8px] text-gray-400">Click to upload / mock</span>
                                  </div>
                                  <div className="border border-dashed border-gray-205 p-3.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 bg-gray-50/50 cursor-pointer">
                                    <FiUploadCloud className="w-6 h-6 text-gray-400" />
                                    <span className="font-bold text-[10px] text-gray-600">Reference Images</span>
                                    <span className="text-[8px] text-gray-400">Click to upload / mock</span>
                                  </div>
                                </div>
                              </div>

                            </div>

                            {/* RIGHT SIDE: Interactive Preview & Live calculations */}
                            <div className="space-y-6">

                              {/* 1. CSS Floor Plan Layout Preview */}
                              <div className="bg-gray-800 text-white rounded-2xl p-4 space-y-3 shadow-md border border-gray-700">
                                <h4 className="font-black text-[10px] text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                  <span>📐 Live Floor Plan Preview</span>
                                  <span className="text-orange-400 font-bold">Auto-calculated</span>
                                </h4>

                                <div className="border border-gray-700 bg-gray-900/60 rounded-xl p-6 flex items-center justify-center min-h-44 relative">

                                  {/* Center layout box */}
                                  <div className="border-4 border-dashed border-orange-500/80 bg-orange-500/5 w-32 h-28 flex flex-col items-center justify-center rounded-lg shadow-inner relative transition-all duration-300">
                                    <span className="text-[9px] font-black uppercase text-orange-400/80 tracking-widest">
                                      {room.roomCode}
                                    </span>
                                    <span className="font-black text-white text-xs mt-1">
                                      {room.length} ft × {room.width} ft
                                    </span>

                                    {/* Wall label markers */}
                                    <div className="absolute top-0 text-[7px] text-gray-500 bg-gray-800 px-1 py-0.5 rounded -translate-y-1/2">W1</div>
                                    <div className="absolute right-0 text-[7px] text-gray-500 bg-gray-800 px-1 py-0.5 rounded translate-x-1/2">W2</div>
                                    <div className="absolute bottom-0 text-[7px] text-gray-500 bg-gray-800 px-1 py-0.5 rounded translate-y-1/2">W3</div>
                                    <div className="absolute left-0 text-[7px] text-gray-500 bg-gray-800 px-1 py-0.5 rounded -translate-x-1/2">W4</div>
                                  </div>

                                  <div className="absolute bottom-1 right-2 text-[8px] text-gray-500">
                                    W = Wall, D = Door, Win = Window
                                  </div>
                                </div>
                              </div>

                              {/* 2. Sticky Live Calculation Summary */}
                              {(() => {
                                const breakdown = calculateRoomAreas(room);
                                return (
                                  <div className="bg-orange-50/40 border border-orange-100 rounded-2xl p-4 space-y-3.5 shadow-sm">
                                    <h4 className="font-extrabold text-orange-850 flex items-center gap-1.5 border-b border-orange-100/50 pb-2">
                                      <span>📊</span> Real-Time Audit Summary
                                    </h4>

                                    <div className="space-y-2 font-bold text-gray-650 text-[10px]">
                                      <div className="flex justify-between">
                                        <span>Gross Wall Area</span>
                                        <span>{breakdown.grossWallArea} sqft</span>
                                      </div>
                                      {breakdown.doorDeduction > 0 && (
                                        <div className="flex justify-between text-red-500">
                                          <span>Door Deductions</span>
                                          <span>-{breakdown.doorDeduction} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.windowDeduction > 0 && (
                                        <div className="flex justify-between text-red-500">
                                          <span>Window Deductions</span>
                                          <span>-{breakdown.windowDeduction} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.cabinetDeduction > 0 && (
                                        <div className="flex justify-between text-red-500">
                                          <span>Cabinet Deductions</span>
                                          <span>-{breakdown.cabinetDeduction} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.tileDeduction > 0 && (
                                        <div className="flex justify-between text-red-500">
                                          <span>Backsplash Tile Exclusions</span>
                                          <span>-{breakdown.tileDeduction} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.mirrorDeduction > 0 && (
                                        <div className="flex justify-between text-red-500">
                                          <span>Bathroom Mirror Exclusions</span>
                                          <span>-{breakdown.mirrorDeduction} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.ventilatorDeduction > 0 && (
                                        <div className="flex justify-between text-red-500">
                                          <span>Ventilator Deductions</span>
                                          <span>-{breakdown.ventilatorDeduction} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.wallpaperDeduction > 0 && (
                                        <div className="flex justify-between text-red-500">
                                          <span>Wallpaper Deductions</span>
                                          <span>-{breakdown.wallpaperDeduction} sqft</span>
                                        </div>
                                      )}

                                      {breakdown.featureWallArea > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Feature Wall Additions</span>
                                          <span>+{breakdown.featureWallArea} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.textureArea > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Texture Additions</span>
                                          <span>+{breakdown.textureArea} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.doorPaintArea > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Door Painting Additions</span>
                                          <span>+{breakdown.doorPaintArea} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.windowPaintArea > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Window Painting Additions</span>
                                          <span>+{breakdown.windowPaintArea} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.grillPaintArea > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Grill / Ventilator Painting Additions</span>
                                          <span>+{breakdown.grillPaintArea} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.ceilingArea > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Ceiling Painting Additions</span>
                                          <span>+{breakdown.ceilingArea} sqft</span>
                                        </div>
                                      )}
                                      {breakdown.additionalPaintItems > 0 && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Additional Paintable Items</span>
                                          <span>+{breakdown.additionalPaintItems} sqft</span>
                                        </div>
                                      )}

                                      <div className="border-t border-orange-100 pt-2.5 mt-2 flex justify-between font-black text-gray-850 text-xs">
                                        <span>Net Paintable Area</span>
                                        <span className="text-orange-600">{breakdown.netPaintableArea} sqft</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                            </div>
                          </div>

                          {/* Footer Action items block */}
                          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4 mt-2">
                            <div className="flex gap-4 select-none">
                              <label className="flex items-center gap-1.5 font-bold text-gray-650 cursor-pointer">
                                <input
                                  disabled={isReadOnly}
                                  type="checkbox"
                                  checked={room.paintCeiling}
                                  onChange={() => {
                                    const updated = [...rooms];
                                    updated[idx].paintCeiling = !room.paintCeiling;
                                    setRooms(updated);
                                  }}
                                  className="rounded text-orange-500 border-gray-200 w-4 h-4 cursor-pointer focus:ring-orange-400"
                                />
                                <span>Paint Ceiling</span>
                              </label>

                              <label className="flex items-center gap-1.5 font-bold text-gray-650 cursor-pointer">
                                <input
                                  disabled={isReadOnly}
                                  type="checkbox"
                                  checked={room.paintWalls}
                                  onChange={() => {
                                    const updated = [...rooms];
                                    updated[idx].paintWalls = !room.paintWalls;
                                    setRooms(updated);
                                  }}
                                  className="rounded text-orange-500 border-gray-200 w-4 h-4 cursor-pointer focus:ring-orange-400"
                                />
                                <span>Paint Walls</span>
                              </label>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => {
                                  const cloned = { ...room, name: `${room.name} (Copy)` };
                                  setRooms(prev => [...prev, cloned]);
                                  toast.success(`Duplicated ${room.name}`);
                                }}
                                className="px-3.5 py-2 border border-gray-250 text-gray-600 hover:bg-gray-50 font-bold rounded-xl transition-all"
                              >
                                Duplicate Room
                              </button>
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => {
                                  if (rooms.length === 1) return toast.error('At least one room is required');
                                  setRooms(prev => prev.filter((_, i) => i !== idx));
                                  toast.success(`Removed ${room.name}`);
                                }}
                                className="px-3.5 py-2 border border-red-200 text-red-500 hover:bg-red-55 font-bold rounded-xl transition-all"
                              >
                                Delete Room
                              </button>
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Room Button */}
              {!isReadOnly && (
                <button
                  onClick={() => {
                    const customRoom = {
                      name: 'Custom Room',
                      roomCode: 'CUSTOM',
                      length: 12,
                      width: 10,
                      height: 10,
                      doorsCount: 1,
                      windowsCount: 1,
                      paintCeiling: true,
                      paintWalls: true,
                      paintDoors: false,
                      paintWindows: false,
                      paintGrills: false
                    };
                    setRooms(prev => [...prev, customRoom]);
                    setExpandedRoomIdx(rooms.length);
                    toast.success('Appended Custom Room blueprint');
                  }}
                  className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-orange-400 text-gray-500 hover:text-orange-600 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 bg-gray-50/50 hover:bg-orange-50/20 cursor-pointer"
                >
                  <FiPlus className="w-4 h-4" /> Add Custom Room
                </button>
              )}

              {/* Summary panel values */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 bg-orange-50/40 p-4 border border-orange-100 rounded-2xl text-xs font-semibold text-gray-700">
                <div>
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block">Interior Walls</span>
                  <span className="text-sm font-black text-gray-800">{property.interiorArea} sqft</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block">Exterior Walls</span>
                  <span className="text-sm font-black text-gray-800">{property.exteriorArea} sqft</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block">Ceilings</span>
                  <span className="text-sm font-black text-gray-800">{property.ceilingArea} sqft</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block">Balconies</span>
                  <span className="text-sm font-black text-gray-800">{property.balconyArea} sqft</span>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-2.5 rounded-xl col-span-2 md:col-span-1">
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block">Grand Paintable Area</span>
                  <span className="text-base font-black text-orange-700">{property.totalPaintableArea} sqft</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Paint Brand */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🎨</span> Step 2: Select Paint Brand
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Select the paint brand to use. Products for quotes will be filtered by this brand.</p>
              </div>

              {brandsList.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                  No active paint brands found in database. Create brand in Admin panel first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {brandsList.map(brand => (
                    <div
                      key={brand._id}
                      onClick={() => !isReadOnly && setSelectedBrand(brand._id)}
                      className={`p-6 border-2 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${selectedBrand === brand._id
                          ? 'border-orange-500 bg-orange-50/20 scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      {brand.logo?.url ? (
                        <img src={brand.logo.url} alt={brand.name} className="h-10 object-contain" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 text-gray-500 font-black rounded-xl flex items-center justify-center text-lg uppercase">
                          {brand.name.substring(0, 2)}
                        </div>
                      )}
                      <span className="font-extrabold text-gray-800">{brand.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{brand.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Paint Product */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🖌️</span> Step 3: Select Paint Products
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Assign paint products to your property's active wall areas.</p>
              </div>

              {!selectedBrand && (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
                  Please select a paint brand in Step 2 first.
                </div>
              )}

              {selectedBrand && (
                <div className="space-y-6">
                  {/* Interior Paint */}
                  {property.interiorArea > 0 && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Interior Paint (Area: {property.interiorArea} sq.ft)</span>
                      </div>
                      <div className={`grid grid-cols-1 ${selectedProducts.interiorPaint.productId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.interiorPaint.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              interiorPaint: { ...selectedProducts.interiorPaint, productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Interior Paint --</option>
                          {getFilteredProducts('Paint').filter(p => p.application === 'Interior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.interiorPaint.productId && (
                          <>
                            <select
                              disabled={isReadOnly}
                              value={JSON.stringify(selectedProducts.interiorPaint.selectedPackSize)}
                              onChange={e => {
                                const size = JSON.parse(e.target.value);
                                setSelectedProducts({
                                  ...selectedProducts,
                                  interiorPaint: { ...selectedProducts.interiorPaint, selectedPackSize: size }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              {productsList.find(p => p._id === selectedProducts.interiorPaint.productId)?.availablePackSizes.map((s, idx) => (
                                <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                              ))}
                            </select>

                            <select
                              disabled={isReadOnly}
                              value={selectedProducts.interiorPaint.coats || 2}
                              onChange={e => {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  interiorPaint: { ...selectedProducts.interiorPaint, coats: Number(e.target.value) }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              <option value="1">1 Coat</option>
                              <option value="2">2 Coats (Default)</option>
                              <option value="3">3 Coats</option>
                              <option value="4">4 Coats</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exterior Paint */}
                  {property.exteriorArea > 0 && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Exterior Paint (Area: {property.exteriorArea} sq.ft)</span>
                      </div>
                      <div className={`grid grid-cols-1 ${selectedProducts.exteriorPaint.productId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.exteriorPaint.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              exteriorPaint: { ...selectedProducts.exteriorPaint, productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Exterior Paint --</option>
                          {getFilteredProducts('Paint').filter(p => p.application === 'Exterior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.exteriorPaint.productId && (
                          <>
                            <select
                              disabled={isReadOnly}
                              value={JSON.stringify(selectedProducts.exteriorPaint.selectedPackSize)}
                              onChange={e => {
                                const size = JSON.parse(e.target.value);
                                setSelectedProducts({
                                  ...selectedProducts,
                                  exteriorPaint: { ...selectedProducts.exteriorPaint, selectedPackSize: size }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              {productsList.find(p => p._id === selectedProducts.exteriorPaint.productId)?.availablePackSizes.map((s, idx) => (
                                <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                              ))}
                            </select>

                            <select
                              disabled={isReadOnly}
                              value={selectedProducts.exteriorPaint.coats || 2}
                              onChange={e => {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  exteriorPaint: { ...selectedProducts.exteriorPaint, coats: Number(e.target.value) }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              <option value="1">1 Coat</option>
                              <option value="2">2 Coats (Default)</option>
                              <option value="3">3 Coats</option>
                              <option value="4">4 Coats</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ceiling Paint */}
                  {property.ceilingArea > 0 && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Ceiling Paint (Area: {property.ceilingArea} sq.ft)</span>
                      </div>
                      <div className={`grid grid-cols-1 ${selectedProducts.ceilingPaint.productId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.ceilingPaint.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              ceilingPaint: { ...selectedProducts.ceilingPaint, productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Ceiling Paint --</option>
                          {getFilteredProducts('Paint').filter(p => p.application === 'Interior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.ceilingPaint.productId && (
                          <>
                            <select
                              disabled={isReadOnly}
                              value={JSON.stringify(selectedProducts.ceilingPaint.selectedPackSize)}
                              onChange={e => {
                                const size = JSON.parse(e.target.value);
                                setSelectedProducts({
                                  ...selectedProducts,
                                  ceilingPaint: { ...selectedProducts.ceilingPaint, selectedPackSize: size }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              {productsList.find(p => p._id === selectedProducts.ceilingPaint.productId)?.availablePackSizes.map((s, idx) => (
                                <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                              ))}
                            </select>

                            <select
                              disabled={isReadOnly}
                              value={selectedProducts.ceilingPaint.coats || 2}
                              onChange={e => {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  ceilingPaint: { ...selectedProducts.ceilingPaint, coats: Number(e.target.value) }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              <option value="1">1 Coat</option>
                              <option value="2">2 Coats (Default)</option>
                              <option value="3">3 Coats</option>
                              <option value="4">4 Coats</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Balcony Paint */}
                  {property.balconyArea > 0 && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Balcony Paint (Area: {property.balconyArea} sq.ft)</span>
                      </div>
                      <div className={`grid grid-cols-1 ${selectedProducts.balconyPaint.productId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.balconyPaint.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              balconyPaint: { ...selectedProducts.balconyPaint, productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Balcony Paint --</option>
                          {getFilteredProducts('Paint').filter(p => p.application === 'Exterior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.balconyPaint.productId && (
                          <>
                            <select
                              disabled={isReadOnly}
                              value={JSON.stringify(selectedProducts.balconyPaint.selectedPackSize)}
                              onChange={e => {
                                const size = JSON.parse(e.target.value);
                                setSelectedProducts({
                                  ...selectedProducts,
                                  balconyPaint: { ...selectedProducts.balconyPaint, selectedPackSize: size }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                            >
                              {productsList.find(p => p._id === selectedProducts.balconyPaint.productId)?.availablePackSizes.map((s, idx) => (
                                <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                              ))}
                            </select>

                            <select
                              disabled={isReadOnly}
                              value={selectedProducts.balconyPaint.coats || 2}
                              onChange={e => {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  balconyPaint: { ...selectedProducts.balconyPaint, coats: Number(e.target.value) }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              <option value="1">1 Coat</option>
                              <option value="2">2 Coats (Default)</option>
                              <option value="3">3 Coats</option>
                              <option value="4">4 Coats</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Select Primer */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🧪</span> Step 4: Select Primers
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Select primer products. Interior Primer applies to Interior+Ceiling areas; Exterior Primer applies to Exterior+Balcony areas.</p>
              </div>

              {!selectedBrand && (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
                  Please select a paint brand in Step 2 first.
                </div>
              )}

              {selectedBrand && (
                <div className="space-y-6">
                  {/* Interior Primer */}
                  {(property.interiorArea > 0 || property.ceilingArea > 0) && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-850 block">Interior Primer (Applied Area: {property.interiorArea + property.ceilingArea} sq.ft)</span>
                      <div className={`grid grid-cols-1 ${selectedProducts.interiorPrimer.productId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.interiorPrimer.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              interiorPrimer: { ...selectedProducts.interiorPrimer, productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Interior Primer --</option>
                          {getFilteredProducts('Primer').filter(p => p.application === 'Interior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.interiorPrimer.productId && (
                          <>
                            <select
                              disabled={isReadOnly}
                              value={JSON.stringify(selectedProducts.interiorPrimer.selectedPackSize)}
                              onChange={e => {
                                const size = JSON.parse(e.target.value);
                                setSelectedProducts({
                                  ...selectedProducts,
                                  interiorPrimer: { ...selectedProducts.interiorPrimer, selectedPackSize: size }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              {productsList.find(p => p._id === selectedProducts.interiorPrimer.productId)?.availablePackSizes.map((s, idx) => (
                                <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                              ))}
                            </select>

                            <select
                              disabled={isReadOnly}
                              value={selectedProducts.interiorPrimer.coats !== undefined ? selectedProducts.interiorPrimer.coats : 1}
                              onChange={e => {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  interiorPrimer: { ...selectedProducts.interiorPrimer, coats: Number(e.target.value) }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              <option value="1">1 Coat (Default)</option>
                              <option value="2">2 Coats</option>
                              <option value="3">3 Coats</option>
                              <option value="4">4 Coats</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exterior Primer */}
                  {(property.exteriorArea > 0 || property.balconyArea > 0) && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-850 block">Exterior Primer (Applied Area: {property.exteriorArea + property.balconyArea} sq.ft)</span>
                      <div className={`grid grid-cols-1 ${selectedProducts.exteriorPrimer.productId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.exteriorPrimer.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              exteriorPrimer: { ...selectedProducts.exteriorPrimer, productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Exterior Primer --</option>
                          {getFilteredProducts('Primer').filter(p => p.application === 'Exterior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.exteriorPrimer.productId && (
                          <>
                            <select
                              disabled={isReadOnly}
                              value={JSON.stringify(selectedProducts.exteriorPrimer.selectedPackSize)}
                              onChange={e => {
                                const size = JSON.parse(e.target.value);
                                setSelectedProducts({
                                  ...selectedProducts,
                                  exteriorPrimer: { ...selectedProducts.exteriorPrimer, selectedPackSize: size }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                            >
                              {productsList.find(p => p._id === selectedProducts.exteriorPrimer.productId)?.availablePackSizes.map((s, idx) => (
                                <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                              ))}
                            </select>

                            <select
                              disabled={isReadOnly}
                              value={selectedProducts.exteriorPrimer.coats !== undefined ? selectedProducts.exteriorPrimer.coats : 1}
                              onChange={e => {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  exteriorPrimer: { ...selectedProducts.exteriorPrimer, coats: Number(e.target.value) }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              <option value="1">1 Coat (Default)</option>
                              <option value="2">2 Coats</option>
                              <option value="3">3 Coats</option>
                              <option value="4">4 Coats</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Select Putty */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🧱</span> Step 5: Select Putty
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Select putty products. Interior Putty applies to Interior+Ceiling areas; Exterior Putty applies to Exterior+Balcony areas.</p>
              </div>

              {!selectedBrand && (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
                  Please select a paint brand in Step 2 first.
                </div>
              )}

              {selectedBrand && (
                <div className="space-y-6">
                  {/* Interior Putty */}
                  {(property.interiorArea > 0 || property.ceilingArea > 0) && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-855 block">Interior Putty (Applied Area: {property.interiorArea + property.ceilingArea} sq.ft)</span>
                      <div className={`grid grid-cols-1 ${selectedProducts.interiorPutty.productId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.interiorPutty.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              interiorPutty: { ...selectedProducts.interiorPutty, productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Interior Putty --</option>
                          {getFilteredProducts('Putty').filter(p => p.application === 'Interior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.interiorPutty.productId && (
                          <>
                            <select
                              disabled={isReadOnly}
                              value={JSON.stringify(selectedProducts.interiorPutty.selectedPackSize)}
                              onChange={e => {
                                const size = JSON.parse(e.target.value);
                                setSelectedProducts({
                                  ...selectedProducts,
                                  interiorPutty: { ...selectedProducts.interiorPutty, selectedPackSize: size }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                            >
                              {productsList.find(p => p._id === selectedProducts.interiorPutty.productId)?.availablePackSizes.map((s, idx) => (
                                <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                              ))}
                            </select>

                            <select
                              disabled={isReadOnly}
                              value={selectedProducts.interiorPutty.coats || 2}
                              onChange={e => {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  interiorPutty: { ...selectedProducts.interiorPutty, coats: Number(e.target.value) }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                            >
                              <option value="1">1 Coat</option>
                              <option value="2">2 Coats (Default)</option>
                              <option value="3">3 Coats</option>
                              <option value="4">4 Coats</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exterior Putty */}
                  {(property.exteriorArea > 0 || property.balconyArea > 0) && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-855 block">Exterior Putty (Applied Area: {property.exteriorArea + property.balconyArea} sq.ft)</span>
                      <div className={`grid grid-cols-1 ${selectedProducts.exteriorPutty.productId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.exteriorPutty.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              exteriorPutty: { ...selectedProducts.exteriorPutty, productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Exterior Putty --</option>
                          {getFilteredProducts('Putty').filter(p => p.application === 'Exterior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.exteriorPutty.productId && (
                          <>
                            <select
                              disabled={isReadOnly}
                              value={JSON.stringify(selectedProducts.exteriorPutty.selectedPackSize)}
                              onChange={e => {
                                const size = JSON.parse(e.target.value);
                                setSelectedProducts({
                                  ...selectedProducts,
                                  exteriorPutty: { ...selectedProducts.exteriorPutty, selectedPackSize: size }
                                });
                              }}
                              className="border border-gray-250 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                            >
                              {productsList.find(p => p._id === selectedProducts.exteriorPutty.productId)?.availablePackSizes.map((s, idx) => (
                                <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                              ))}
                            </select>

                            <select
                              disabled={isReadOnly}
                              value={selectedProducts.exteriorPutty.coats || 2}
                              onChange={e => {
                                setSelectedProducts({
                                  ...selectedProducts,
                                  exteriorPutty: { ...selectedProducts.exteriorPutty, coats: Number(e.target.value) }
                                });
                              }}
                              className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                            >
                              <option value="1">1 Coat</option>
                              <option value="2">2 Coats (Default)</option>
                              <option value="3">3 Coats</option>
                              <option value="4">4 Coats</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Select Labour Rate */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>👷</span> Step 6: Select Labour Rates
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Select labour rates for interior and exterior painting services.</p>
              </div>

              <div className="space-y-6">
                {/* Interior Labour */}
                {(property.interiorArea > 0 || property.ceilingArea > 0 || property.balconyArea > 0) && (
                  <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                    <span className="text-sm font-bold text-gray-850 block">Interior Labour (Applied Area: {property.interiorArea + property.ceilingArea + property.balconyArea} sq.ft)</span>
                    <select
                      disabled={isReadOnly}
                      value={selectedLabour.interiorLabour}
                      onChange={e => setSelectedLabour({ ...selectedLabour, interiorLabour: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                    >
                      <option value="">-- Select Interior Labour Rate --</option>
                      {labourRatesList.filter(r => r.application === 'INTERIOR').map(r => (
                        <option key={r._id} value={r._id}>{r.workType} [₹{r.pricePerSqft}/sq.ft]</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Exterior Labour */}
                {property.exteriorArea > 0 && (
                  <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                    <span className="text-sm font-bold text-gray-850 block">Exterior Labour (Applied Area: {property.exteriorArea} sq.ft)</span>
                    <select
                      disabled={isReadOnly}
                      value={selectedLabour.exteriorLabour}
                      onChange={e => setSelectedLabour({ ...selectedLabour, exteriorLabour: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                    >
                      <option value="">-- Select Exterior Labour Rate --</option>
                      {labourRatesList.filter(r => r.application === 'EXTERIOR').map(r => (
                        <option key={r._id} value={r._id}>{r.workType} [₹{r.pricePerSqft}/sq.ft]</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Additional Charges */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                    <span>⚡</span> Step 7: Optional Charges
                  </h2>
                  <p className="text-sm text-gray-400 font-semibold mt-1">Add optional charges like Scaffolding, Wall Repair, or Transportation.</p>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => setAdditionalCharges([...additionalCharges, { title: 'Transportation', amount: 0, remarks: '' }])}
                    className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Add Charge
                  </button>
                )}
              </div>

              {additionalCharges.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                  No additional charges added. Click "Add Charge" to customize.
                </div>
              ) : (
                <div className="space-y-3">
                  {additionalCharges.map((item, idx) => (
                    <div key={idx} className="p-4 border-2 border-gray-150 rounded-2xl flex flex-col md:flex-row items-center gap-3 bg-gray-50/50">
                      <select
                        disabled={isReadOnly}
                        value={item.title}
                        onChange={e => {
                          const updated = [...additionalCharges];
                          updated[idx].title = e.target.value;
                          setAdditionalCharges(updated);
                        }}
                        className="w-full md:w-48 border border-gray-250 rounded-xl px-3 py-2 bg-white text-gray-800 outline-none text-sm font-semibold"
                      >
                        <option value="Transportation">Transportation</option>
                        <option value="Scaffolding">Scaffolding</option>
                        <option value="Furniture Protection">Furniture Protection</option>
                        <option value="Wall Repair">Wall Repair</option>
                        <option value="Texture Work">Texture Work</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Other">Other</option>
                      </select>

                      <input
                        disabled={isReadOnly}
                        type="number"
                        min="0"
                        placeholder="₹ Amount"
                        value={item.amount || ''}
                        onChange={e => {
                          const updated = [...additionalCharges];
                          updated[idx].amount = Number(e.target.value) || 0;
                          setAdditionalCharges(updated);
                        }}
                        className="w-full md:w-32 border border-gray-250 rounded-xl px-3 py-2 text-gray-800 outline-none text-sm font-bold text-center"
                      />

                      <input
                        disabled={isReadOnly}
                        type="text"
                        placeholder="Remarks / details..."
                        value={item.remarks}
                        onChange={e => {
                          const updated = [...additionalCharges];
                          updated[idx].remarks = e.target.value;
                          setAdditionalCharges(updated);
                        }}
                        className="flex-1 w-full border border-gray-250 rounded-xl px-3 py-2 text-gray-850 outline-none text-sm font-semibold"
                      />

                      {!isReadOnly && (
                        <button
                          onClick={() => setAdditionalCharges(additionalCharges.filter((_, i) => i !== idx))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 8: Review Quotation */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>📊</span> Step 8: Review Quotation
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Review live quotation pricing. Adjust discounts if permitted.</p>
              </div>

              {/* Cost Summary card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Quotation Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-semibold">Material Cost</span>
                    <span className="font-extrabold text-base">₹{calculated.materialCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-semibold">Labour Cost</span>
                    <span className="font-extrabold text-base">₹{calculated.labourCost.toLocaleString()}</span>
                  </div>
                  {calculated.additionalCharges > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="opacity-70 font-semibold">Additional Charges</span>
                      <span className="font-extrabold text-base">₹{calculated.additionalCharges.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="h-px bg-white/10 my-3"></div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-semibold">Discount</span>
                    <span className="font-extrabold text-emerald-400">-₹{calculated.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-semibold">GST (18%)</span>
                    <span className="font-extrabold text-base">₹{calculated.gst.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-white/20 pt-4 mt-3 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-0.5">Grand Total</span>
                      <span className="text-3xl font-black">₹{calculated.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adjust Discounts */}
              <div className="p-5 border-2 border-gray-150 rounded-3xl space-y-4">
                <span className="text-sm font-bold text-gray-800 block">Apply Discount</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Discount Type</label>
                    <div className="flex border border-gray-250 rounded-xl overflow-hidden font-bold text-xs">
                      {['NONE', 'FLAT', 'PERCENTAGE'].map(t => (
                        <button
                          key={t}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => setDiscount({ ...discount, type: t, value: 0 })}
                          className={`flex-1 py-3 text-center transition-all ${discount.type === t
                              ? 'bg-orange-500 text-white'
                              : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {t === 'NONE' ? 'None' : t === 'FLAT' ? 'Flat' : '%'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {discount.type !== 'NONE' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Discount Value</label>
                        <div className="flex items-center border border-gray-250 rounded-xl px-3 bg-white">
                          {discount.type === 'FLAT' ? <FiDollarSign className="text-gray-400 w-4 h-4 mr-1" /> : null}
                          <input
                            disabled={isReadOnly}
                            type="number"
                            min="0"
                            value={discount.value || ''}
                            onChange={e => setDiscount({ ...discount, value: Number(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full py-2 bg-transparent text-sm font-bold text-gray-800 outline-none"
                          />
                          {discount.type === 'PERCENTAGE' ? <FiPercent className="text-gray-400 w-4 h-4 ml-1" /> : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Reason / Remarks</label>
                        <input
                          disabled={isReadOnly}
                          type="text"
                          value={discount.reason}
                          onChange={e => setDiscount({ ...discount, reason: e.target.value })}
                          placeholder="e.g. Festival Season offer"
                          className="w-full border border-gray-250 rounded-xl px-3 py-2 bg-white text-sm font-semibold text-gray-800 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <span className="text-sm font-bold text-gray-850 block">Detailed Items Breakdown</span>

                {/* Products table */}
                <div className="border border-gray-150 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Selected Products (Materials)
                  </div>
                  {calculated.products.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">No products selected.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 text-sm">
                      {calculated.products.map((p, idx) => (
                        <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-gray-800 block">{p.label}</span>
                            <span className="text-xs text-gray-400 font-semibold">
                              {p.productName} ({p.productCode})
                              {p.packBreakdown && p.packBreakdown.length > 0 ? (
                                ` • Packs: ${p.packBreakdown.map(pb => `${pb.count}x${pb.size}L`).join(' + ')}`
                              ) : (
                                ` • Pack: ${p.selectedPackSize?.size} ${p.selectedPackSize?.unit}`
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-6 text-right">
                            <div className="text-xs font-semibold text-gray-400">
                              <div>Required: {p.quantityRequired} Unit</div>
                              <div>
                                Purchased: {p.quantityPurchased} Pack
                                {p.packBreakdown && p.packBreakdown.length > 0 && (
                                  <span className="block text-[10px] text-gray-400 font-normal">
                                    ({p.packBreakdown.map(pb => `${pb.count}x${pb.size}L`).join(', ')})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="font-bold text-gray-800">
                              ₹{p.subtotal.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Labour list */}
                <div className="border border-gray-150 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Labour Services
                  </div>
                  {calculated.labour.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">No labour rates selected.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 text-sm">
                      {calculated.labour.map((l, idx) => (
                        <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-gray-800 block">{l.label}</span>
                            <span className="text-xs text-gray-400 font-semibold">Service Mode: {l.workType} • Rate: ₹{l.pricePerSqFt}/sq.ft</span>
                          </div>
                          <div className="flex items-center gap-6 text-right">
                            <div className="text-xs font-semibold text-gray-400">
                              Area: {l.area} sq.ft
                            </div>
                            <div className="font-bold text-gray-800">
                              ₹{l.subtotal.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 9: Submit to Admin */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>📤</span> Step 9: Submit to Admin
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Review finalized remarks, upload property inspection attachments, and submit to Admin.</p>
              </div>

              {/* Remarks */}
              <div className="space-y-4">
                <span className="text-sm font-bold text-gray-800 block">Quotation Remarks</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Vendor Internal Remarks</label>
                    <textarea
                      disabled={isReadOnly}
                      rows={3}
                      value={remarks.vendorRemarks}
                      onChange={e => setRemarks({ ...remarks, vendorRemarks: e.target.value })}
                      placeholder="Visible to Admin and vendor only..."
                      className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-semibold outline-none bg-white resize-none text-gray-850"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Customer Remarks</label>
                    <textarea
                      disabled={isReadOnly}
                      rows={3}
                      value={remarks.customerRemarks}
                      onChange={e => setRemarks({ ...remarks, customerRemarks: e.target.value })}
                      placeholder="Notes or conditions to display on customer quotation..."
                      className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-semibold outline-none bg-white resize-none text-gray-850"
                    />
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-4">
                <span className="text-sm font-bold text-gray-800 block">Property Attachments</span>

                {['inspectionPhotos', 'beforePhotos', 'referenceImages'].map(field => (
                  <div key={field} className="p-5 border border-gray-150 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {field === 'inspectionPhotos' ? 'Property Inspection Photos' :
                          field === 'beforePhotos' ? 'Before Work Photos' :
                            'Reference Design Images'}
                      </span>
                      {!isReadOnly && (
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                          <FiUploadCloud className="w-3.5 h-3.5" />
                          Upload
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={e => handleMockUpload(field, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {uploading[field] ? (
                      <div className="flex items-center gap-2 py-4 justify-center">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-400 font-bold">Uploading files...</span>
                      </div>
                    ) : attachments[field].length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No photos uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {attachments[field].map((url, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                            <img src={url} alt="attachment" className="w-full h-full object-cover" />
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(field, idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex gap-3 border-t border-gray-100 pt-6 mt-6">
            <button
              onClick={goBack}
              className="px-5 py-3 border-2 border-gray-250 hover:bg-gray-50 rounded-2xl text-sm font-bold text-gray-500 transition-all"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-1 shadow-lg shadow-orange-100"
              >
                Next Step <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || isReadOnly}
                onClick={handleSubmitToAdmin}
                className={`flex-1 font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 text-white shadow-xl ${submitting || isReadOnly
                    ? 'bg-orange-300 cursor-not-allowed shadow-none'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 hover:scale-[1.01]'
                  }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiFileText className="w-4 h-4" /> Submit to Admin
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default VendorQuoteWizard;
