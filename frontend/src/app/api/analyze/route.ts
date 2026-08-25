import { NextRequest, NextResponse } from 'next/server';
import { generateSimulatedAnalysis } from '@/lib/mock-data';
import { InputMode } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const query = (formData.get('query') as string) || 'Satellite analysis request';
    const mode = (formData.get('mode') as InputMode) || 'single';
    
    // Count uploaded files
    let fileCount = 0;
    for (const key of formData.keys()) {
      if (key.startsWith('file_')) {
        fileCount++;
      }
    }

    // Try forwarding to local FastAPI if active
    const fastapiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const upstreamRes = await fetch(`${fastapiUrl}/api/analysis/`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const upstreamData = await upstreamRes.json();
        return NextResponse.json(upstreamData);
      }
    } catch (e) {
      // Backend not running; fallback to deterministic engine
    }

    const simulated = generateSimulatedAnalysis(query, mode, Math.max(fileCount, 1));
    return NextResponse.json(simulated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Analysis pipeline execution failed' },
      { status: 500 }
    );
  }
}
