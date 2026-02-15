import Link from 'next/link';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Page Not Found - Baba Selo',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-amber-50/80 to-white">
      <div className="max-w-md w-full p-8">
        <div className="mb-6 flex justify-center">
          <Image 
            src="/baba-removebg.png" 
            alt="Baba Selo" 
            width={180} 
            height={180}
            priority
          />
        </div>
        <h1 className="text-3xl font-bold mb-4">Oi! Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          Ay, my dear friend! Baba Selo cannot find this page in her recipe book. 
          Like my grandmother always said, "When the road ends, turn around and find a better one!"
          Let's go back to the kitchen where all the magic happens, hmm?
        </p>
        <Link 
          href="/" 
          className="inline-block px-6 py-2 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors"
        >
          Return to Kitchen
        </Link>
      </div>
    </div>
  );
} 