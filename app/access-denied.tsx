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
        <h1 className="text-3xl font-bold mb-4">Oi Oi! Not So Fast</h1>
        <p className="text-gray-600 mb-4">
          My dearest friend, Baba Selo must deliver some sad news. My magical recipes haven't yet crossed the sea to your beautiful country! 
          
          In my little <i>selo</i> on the Dalmatian coast, we're still preparing our special blend of spices and wisdom for your region. The olive oil must settle, the spoons must be blessed!
        </p>
        <div className="text-sm text-gray-500 mb-8">
          Currently stirring pots in the United States, Canada, United Kingdom, European countries, and the United Arab Emirates. <i>Živili!</i>
        </div>
        <Link 
          href="/" 
          className="inline-block px-6 py-2 bg-black text-white font-medium rounded-xl hover:bg-gray-900 transition-colors"
        >
          Back to Kitchen
        </Link>
      </div>
    </div>
  );
} 