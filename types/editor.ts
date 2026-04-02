export type NetworkId = 'instagram' | 'x' | 'linkedin';

export type EditorFormat = {
  networkId: NetworkId;
  formatKey: string;
  canvas: { width: number; height: number };
  label: string;
};

export type FilterPreset = {
  id: string;
  label: string;
  css: string;
  thumbnail?: string;
};

export type ExportOptions = {
  format: 'png' | 'jpeg';
  multiplier: 2 | 3 | 4;
  quality: number;
  filename: string;
  activeFilterCSS: string;
};

export type EditorState = {
  networkId: NetworkId;
  formatKey: string;
  activeFilterId: string;
  activeFilterCSS: string;
  canvasJSON: object | null;
  previewDataURL: string | null;
  isDirty: boolean;
  isExporting: boolean;
};

export type EditorPanelTab = 'slides' | 'theme' | 'assets' | 'filters' | 'fonts';
