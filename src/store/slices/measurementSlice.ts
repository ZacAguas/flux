/**
 * Measurement Slice
 *
 * State management for distance and angle measurement tools.
 */

import type { StateCreator } from 'zustand';
import type { ViewerStore } from '../storeTypes';
import type {
  Measurement,
  MeasurementTool,
  MeasurementType,
  MeasurementPoint,
  DistanceMeasurement,
  AngleMeasurement,
  MeasurementStatus,
} from '../../types/measurement';
import type { SliceOrientation } from '../../types/layout';
import { MEASUREMENT_COLORS } from '../../types/measurement';

export interface MeasurementSlice {
  // State
  measurements: Measurement[];
  activeTool: MeasurementTool;
  activeMeasurementId: string | null; // Measurement currently being placed
  selectedMeasurementId: string | null; // Measurement selected for editing/deletion
  showMeasurements: boolean;

  // Actions
  setActiveTool: (tool: MeasurementTool) => void;
  setShowMeasurements: (show: boolean) => void;
  setSelectedMeasurement: (id: string | null) => void;

  // Measurement creation/editing
  startMeasurement: (
    type: MeasurementType,
    orientation: SliceOrientation,
    sliceIndex: number,
    firstPoint: MeasurementPoint
  ) => string; // Returns new measurement ID
  addPointToMeasurement: (point: MeasurementPoint) => void;
  completeMeasurement: (calculatedValue: number) => void;
  cancelMeasurement: () => void;
  deleteMeasurement: (id: string) => void;
  clearAllMeasurements: () => void;

  // Bulk operations for session restore
  setMeasurements: (measurements: Measurement[]) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const createMeasurementSlice: StateCreator<
  ViewerStore,
  [],
  [],
  MeasurementSlice
> = (set, get) => ({
  // Initial state
  measurements: [],
  activeTool: 'none',
  activeMeasurementId: null,
  selectedMeasurementId: null,
  showMeasurements: true,

  // Actions
  setActiveTool: (tool) => {
    // Cancel any in-progress measurement when switching tools
    const { activeMeasurementId, measurements } = get();
    if (activeMeasurementId) {
      set({
        measurements: measurements.filter((m) => m.id !== activeMeasurementId),
        activeMeasurementId: null,
      });
    }
    set({ activeTool: tool, selectedMeasurementId: null });
  },

  setShowMeasurements: (show) => set({ showMeasurements: show }),

  setSelectedMeasurement: (id) => set({ selectedMeasurementId: id }),

  startMeasurement: (type, orientation, sliceIndex, firstPoint) => {
    const id = generateId();
    const color = type === 'distance' ? MEASUREMENT_COLORS.distance : MEASUREMENT_COLORS.angle;

    const baseMeasurement = {
      id,
      type,
      orientation,
      sliceIndex,
      status: 'placing' as MeasurementStatus,
      color,
      createdAt: Date.now(),
    };

    let newMeasurement: Measurement;
    if (type === 'distance') {
      newMeasurement = {
        ...baseMeasurement,
        type: 'distance',
        points: [firstPoint, undefined],
      } as DistanceMeasurement;
    } else {
      newMeasurement = {
        ...baseMeasurement,
        type: 'angle',
        points: [firstPoint, undefined, undefined],
      } as AngleMeasurement;
    }

    set((state) => ({
      measurements: [...state.measurements, newMeasurement],
      activeMeasurementId: id,
      selectedMeasurementId: null,
    }));

    return id;
  },

  addPointToMeasurement: (point) => {
    const { activeMeasurementId, measurements } = get();
    if (!activeMeasurementId) return;

    set({
      measurements: measurements.map((m) => {
        if (m.id !== activeMeasurementId) return m;

        if (m.type === 'distance') {
          const dm = m as DistanceMeasurement;
          return {
            ...dm,
            points: [dm.points[0], point] as [MeasurementPoint, MeasurementPoint],
          };
        } else {
          const am = m as AngleMeasurement;
          // Find first empty slot
          if (!am.points[1]) {
            return {
              ...am,
              points: [am.points[0], point, undefined] as [MeasurementPoint, MeasurementPoint, MeasurementPoint?],
            };
          } else {
            return {
              ...am,
              points: [am.points[0], am.points[1], point] as [MeasurementPoint, MeasurementPoint, MeasurementPoint],
            };
          }
        }
      }),
    });
  },

  completeMeasurement: (calculatedValue) => {
    const { activeMeasurementId, measurements, activeTool } = get();
    if (!activeMeasurementId) return;

    set({
      measurements: measurements.map((m) => {
        if (m.id !== activeMeasurementId) return m;

        if (m.type === 'distance') {
          return {
            ...m,
            status: 'complete' as MeasurementStatus,
            distance: calculatedValue,
          };
        } else {
          return {
            ...m,
            status: 'complete' as MeasurementStatus,
            angle: calculatedValue,
          };
        }
      }),
      activeMeasurementId: null,
      // Keep tool active for placing more measurements of same type
      activeTool,
    });

    // Mark session dirty if available
    // NOTE: Technically, we've coupled slices, so we could subscribe instead.
    const markDirty = (get() as ViewerStore).markDirty;
    if (markDirty) {
      markDirty();
    }
  },

  cancelMeasurement: () => {
    const { activeMeasurementId, measurements } = get();
    if (!activeMeasurementId) return;

    set({
      measurements: measurements.filter((m) => m.id !== activeMeasurementId),
      activeMeasurementId: null,
    });
  },

  deleteMeasurement: (id) => {
    set((state) => ({
      measurements: state.measurements.filter((m) => m.id !== id),
      selectedMeasurementId:
        state.selectedMeasurementId === id ? null : state.selectedMeasurementId,
      activeMeasurementId:
        state.activeMeasurementId === id ? null : state.activeMeasurementId,
    }));

    // Mark session dirty if available
    const markDirty = (get() as ViewerStore).markDirty;
    if (markDirty) {
      markDirty();
    }
  },

  clearAllMeasurements: () => {
    set({
      measurements: [],
      activeMeasurementId: null,
      selectedMeasurementId: null,
    });

    // Mark session dirty if available
    const markDirty = (get() as ViewerStore).markDirty;
    if (markDirty) {
      markDirty();
    }
  },

  setMeasurements: (measurements) => set({ measurements }),
});
