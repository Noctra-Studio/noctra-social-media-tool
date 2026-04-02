import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import type { SlideRenderData, SlideObject } from '@/lib/editor/extract-slide-data';

export const runtime = 'edge';

/**
 * High-fidelity Export Renderer using Vercel OG (Satori)
 * social.noctra.studio
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slideData, scale = 2 } = body;

    if (!slideData) {
      return new Response(JSON.stringify({ error: 'Missing slideData' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { background, dimming, objects, canvasSize } = slideData as SlideRenderData;
    const width = canvasSize.width * scale;
    const height = canvasSize.height * scale;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: background.type === 'color' ? background.value : '#101417',
            backgroundImage: background.type === 'gradient' ? background.value : 'none',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Image Layer */}
          {background.type === 'image' && (
            <img
              src={background.value}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* Dimming Overlay */}
          {dimming > 0 && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: `rgba(0,0,0,${dimming})`,
              }}
            />
          )}

          {/* Canvas Layers */}
          {objects
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((obj: SlideObject, i: number) => {
              const left = obj.x * 100 + '%';
              const top = obj.y * 100 + '%';
              const objWidth = obj.width * 100 + '%';
              const objHeight = obj.height * 100 + '%';

              if (obj.type === 'text') {
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: objWidth,
                      height: objHeight,
                      color: obj.fill || '#E0E5EB',
                      fontSize: (obj.fontSize || 16) * scale,
                      fontWeight: obj.fontWeight || '700',
                      fontFamily: obj.fontFamily || 'Inter',
                      textAlign: (obj.textAlign as any) || 'left',
                      lineHeight: obj.lineHeight || 1.2,
                      letterSpacing: (obj.charSpacing || 0) / 1000 + 'em',
                      opacity: obj.opacity,
                      transform: `rotate(${obj.angle || 0}deg)`,
                      display: 'flex',
                    }}
                  >
                    {obj.text}
                  </div>
                );
              }

              if (obj.type === 'image' || obj.type === 'icon') {
                return (
                  <img
                    key={i}
                    src={obj.fill}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: objWidth,
                      height: objHeight,
                      opacity: obj.opacity,
                      borderRadius: (obj.borderRadius || 0) * scale,
                      transform: `rotate(${obj.angle || 0}deg)`,
                    }}
                  />
                );
              }

              if (obj.type === 'rect') {
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width: objWidth,
                      height: objHeight,
                      backgroundColor: obj.backgroundColor,
                      borderColor: obj.borderColor,
                      borderWidth: (obj.borderWidth || 0) * scale,
                      borderRadius: (obj.borderRadius || 0) * scale,
                      opacity: obj.opacity,
                      transform: `rotate(${obj.angle || 0}deg)`,
                    }}
                  />
                );
              }

              return null;
            })}
          
          {/* Subtle Branding */}
          <div style={{
            position: 'absolute',
            bottom: 40 * scale,
            right: 40 * scale,
            display: 'flex',
            alignItems: 'center',
            gap: 8 * scale,
            opacity: 0.3
          }}>
            <div style={{ width: 10 * scale, height: 10 * scale, backgroundColor: '#A855F7', borderRadius: 2 }} />
            <span style={{ fontSize: 12 * scale, color: '#E0E5EB', fontWeight: 600, letterSpacing: 1 }}>NOCTRA</span>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (e: any) {
    console.error('OG Render API Error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
