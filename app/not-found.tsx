import Link from 'next/link';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Page Not Found - Baba Selo',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
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
        <h1 className="text-3xl font-bold mb-4">Oops! Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          Ah, my friend! Baba Selo cannot find this page in her recipe book. 
          Perhaps we should return to the kitchen and try another dish?
        </p>
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