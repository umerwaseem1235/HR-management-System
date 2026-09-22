import { NextResponse } from 'next/server';
import { getLookupData } from '@/lib/actions/employees';

export async function GET() {
  try {
    const data = await getLookupData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to fetch lookup data' }, { status: 500 });
  }
}