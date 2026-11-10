import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 401 });
    }

    const [staffSnap, hotelsSnap] = await Promise.all([
      db.collection('onboarding_staff').get(),
      db.collection('hotels').get()
    ]);

    const hotels = hotelsSnap.docs.map(d => d.data());

    const staff = staffSnap.docs.map(doc => {
      const data = doc.data();
      const staffEmail = (data.email || '').toLowerCase().trim();
      const staffId = doc.id;

      // Calculate hotels onboarded by this staff
      const onboardedCount = hotels.filter((h: any) => {
        if (h.onboardedBy) {
          if (typeof h.onboardedBy === 'string' && h.onboardedBy.toLowerCase().trim() === staffEmail) return true;
          if (typeof h.onboardedBy === 'object') {
            if (h.onboardedBy.email && h.onboardedBy.email.toLowerCase().trim() === staffEmail) return true;
            if (h.onboardedBy.id && h.onboardedBy.id === staffId) return true;
          }
        }
        return false;
      }).length;

      return {
        _id: doc.id,
        ...data,
        hotelsOnboarded: onboardedCount
      };
    });

    staff.sort((a: any, b: any) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Failed to fetch onboarding staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 401 });
    }

    const { email, name, phone, notes } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid Gmail or email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if staff already exists in onboarding_staff
    const existingSnap = await db.collection('onboarding_staff')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    let staffId: string;
    const staffData = {
      email: normalizedEmail,
      name: (name || '').trim() || 'Onboarding Executive',
      phone: (phone || '').trim(),
      notes: (notes || '').trim(),
      status: 'active',
      accessScope: 'extranet_b2c_only', // Strictly no admin access
      addedAt: new Date().toISOString(),
      addedBy: session.user.email || 'Admin',
    };

    if (!existingSnap.empty) {
      staffId = existingSnap.docs[0].id;
      await db.collection('onboarding_staff').doc(staffId).update(staffData);
    } else {
      const docRef = await db.collection('onboarding_staff').add(staffData);
      staffId = docRef.id;
    }

    // Sync role in users collection to 'onboarder'
    try {
      const userSnap = await db.collection('users').where('email', '==', normalizedEmail).limit(1).get();
      if (!userSnap.empty) {
        await userSnap.docs[0].ref.update({
          role: 'onboarder',
          partnerStatus: 'approved',
          isOnboarder: true
        });
      } else {
        await db.collection('users').add({
          email: normalizedEmail,
          name: staffData.name,
          phone: staffData.phone,
          role: 'onboarder',
          partnerStatus: 'approved',
          isOnboarder: true,
          isActive: true,
          createdAt: new Date()
        });
      }
    } catch (userSyncErr) {
      console.warn('User role sync warning in onboarding staff:', userSyncErr);
    }

    return NextResponse.json({ 
      success: true, 
      staff: { _id: staffId, ...staffData, hotelsOnboarded: 0 } 
    });
  } catch (error: any) {
    console.error('Failed to add onboarding staff:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 401 });
    }

    const { id, email } = await req.json();
    if (!id && !email) {
      return NextResponse.json({ error: 'Missing staff id or email to remove' }, { status: 400 });
    }

    let staffEmail = email ? email.toLowerCase().trim() : null;

    if (id) {
      const docSnap = await db.collection('onboarding_staff').doc(id).get();
      if (docSnap.exists) {
        staffEmail = staffEmail || docSnap.data()?.email?.toLowerCase().trim();
        await docSnap.ref.delete();
      }
    } else if (staffEmail) {
      const snap = await db.collection('onboarding_staff').where('email', '==', staffEmail).get();
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Revoke onboarder role in users collection
    if (staffEmail) {
      try {
        const userSnap = await db.collection('users').where('email', '==', staffEmail).limit(1).get();
        if (!userSnap.empty) {
          const uData = userSnap.docs[0].data();
          // Never downgrade super admin
          if (uData.role !== 'admin') {
            await userSnap.docs[0].ref.update({
              role: 'customer',
              isOnboarder: false
            });
          }
        }
      } catch (err) {
        console.warn('User role revoke error:', err);
      }
    }

    return NextResponse.json({ success: true, message: 'Onboarding staff removed successfully' });
  } catch (error: any) {
    console.error('Failed to delete onboarding staff:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
