import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files: File[] = [];

    // Support both 'file' and 'files' form fields
    const singleFile = formData.get('file');
    if (singleFile && singleFile instanceof File) {
      files.push(singleFile);
    }
    const multiFiles = formData.getAll('files');
    for (const f of multiFiles) {
      if (f instanceof File && !files.includes(f)) {
        files.push(f);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
      process.env.CLOUDINARY_API_SECRET &&
      process.env.CLOUDINARY_API_SECRET !== 'your_api_secret'
    );

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (hasCloudinary) {
        try {
          const timestamp = Math.round(new Date().getTime() / 1000);
          const secret = process.env.CLOUDINARY_API_SECRET!;
          const apiKey = process.env.CLOUDINARY_API_KEY!;
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;

          const signature = crypto
            .createHash('sha1')
            .update(`timestamp=${timestamp}${secret}`)
            .digest('hex');

          const cFormData = new FormData();
          const blob = new Blob([buffer], { type: file.type });
          cFormData.append('file', blob, file.name);
          cFormData.append('api_key', apiKey);
          cFormData.append('timestamp', String(timestamp));
          cFormData.append('signature', signature);

          const cRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: cFormData
          });
          const cData = await cRes.json();
          if (cData.secure_url) {
            uploadedUrls.push(cData.secure_url);
            continue;
          }
        } catch (cErr) {
          console.warn('Cloudinary upload failed, falling back to local storage', cErr);
        }
      }

      // Local disk storage fallback in public/uploads (for local dev)
      let savedUrl: string | null = null;
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext = path.extname(file.name) || '.jpg';
        const cleanName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${Date.now()}_${cleanName}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, buffer);
        savedUrl = `/uploads/${filename}`;
      } catch (err) {
        // Read-only filesystem (e.g. Vercel serverless)
        savedUrl = null;
      }

      if (savedUrl) {
        uploadedUrls.push(savedUrl);
      } else {
        // Dedicated persistent storage in Firestore hotel_images collection
        try {
          const base64 = buffer.toString('base64');
          const mimeType = file.type || 'image/jpeg';
          const imgDocRef = db.collection('hotel_images').doc();
          await imgDocRef.set({
            data: base64,
            contentType: mimeType,
            name: file.name || 'hotel-photo.jpg',
            size: buffer.length,
            createdAt: new Date().toISOString()
          });
          uploadedUrls.push(`/api/images/${imgDocRef.id}`);
        } catch (dbErr) {
          console.error('Failed to store image in Firestore:', dbErr);
          const base64 = buffer.toString('base64');
          const mimeType = file.type || 'image/jpeg';
          uploadedUrls.push(`data:${mimeType};base64,${base64}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0] || null,
      urls: uploadedUrls
    });
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const secret = process.env.CLOUDINARY_API_SECRET || '';
  
  if (!secret) {
    return NextResponse.json({ error: 'Cloudinary secret not configured' }, { status: 500 });
  }

  const signature = crypto
    .createHash('sha1')
    .update(`timestamp=${timestamp}${secret}`)
    .digest('hex');

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY
  });
}

