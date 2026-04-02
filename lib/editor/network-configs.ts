export const NETWORK_CONFIGS = {
  instagram: {
    feed_square: {
      canvas: { width: 1080, height: 1080 },
      export: { width: 1080, height: 1080 },
      shell_ar: '1/1',
      label: 'Post cuadrado',
    },
    feed_portrait: {
      canvas: { width: 1080, height: 1350 },
      export: { width: 1080, height: 1350 },
      shell_ar: '4/5',
      label: 'Post vertical',
    },
    story: {
      canvas: { width: 1080, height: 1920 },
      export: { width: 1080, height: 1920 },
      shell_ar: '9/16',
      label: 'Historia',
    },
    carousel_slide: {
      canvas: { width: 1080, height: 1080 },
      export: { width: 1080, height: 1080 },
      shell_ar: '1/1',
      label: 'Carrusel',
    },
  },
  x: {
    single_image: {
      canvas: { width: 1600, height: 900 },
      export: { width: 1600, height: 900 },
      shell_ar: '16/9',
      label: 'Imagen en tweet',
    },
    thread_card: {
      canvas: { width: 1200, height: 675 },
      export: { width: 1200, height: 675 },
      shell_ar: '16/9',
      label: 'Card de hilo',
    },
  },
  linkedin: {
    single_image: {
      canvas: { width: 1200, height: 627 },
      export: { width: 1200, height: 627 },
      shell_ar: '1.91/1',
      label: 'Imagen en post',
    },
    portrait: {
      canvas: { width: 1080, height: 1350 },
      export: { width: 1080, height: 1350 },
      shell_ar: '4/5',
      label: 'Imagen vertical',
    },
    document_cover: {
      canvas: { width: 1128, height: 635 },
      export: { width: 1128, height: 635 },
      shell_ar: '1.78/1',
      label: 'Portada de documento',
    },
  },
} as const;

export type NetworkId = keyof typeof NETWORK_CONFIGS;
export type FormatId<N extends NetworkId> = keyof typeof NETWORK_CONFIGS[N];
export type CanvasSize = { width: number; height: number };
export type NetworkFormat = {
  canvas: CanvasSize;
  export: CanvasSize;
  shell_ar: string;
  label: string;
};
