import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

      // Local disk storage fallback in public/uploads
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
        uploadedUrls.push(`/uploads/${filename}`);
      } catch (err) {
        // In serverless read-only environment, fallback to Base64 data URI
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'image/jpeg';
        uploadedUrls.push(`data:${mimeType};base64,${base64}`);
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

