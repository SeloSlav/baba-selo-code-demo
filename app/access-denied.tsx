import Link from 'next/link';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Access Denied - Baba Selo',
  description: 'This content is not available in your region.',
};

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
      <div className="max-w-md w-full p-8">
        <div className="mb-6 flex justify-center">
          <Image 
            src="/baba.png" 
            alt="Baba Selo" 
            width={180} 
            height={180}
            priority
          />
        </div>
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          Oh no, my friend! Baba Selo's magical recipes are not available in your country yet. 
          Baba is still preparing her special ingredients for your region. 
          Please check back later when Baba's cooking pot has reached your shores!
        </p>
        <div className="text-sm text-gray-500 mb-8">
          Available only in US, Canada, UK, and Europe.
        </div>
        <Link 
          href="/" 
          className="inline-block px-6 py-2 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 