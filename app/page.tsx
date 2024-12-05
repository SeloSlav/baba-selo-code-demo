import React from 'react';
import { ConversationComponent } from './components/conversation';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between  ">
      <div className="z-10  w-full items-center justify-between font-mono text-sm">
        <ConversationComponent />
      </div>
    </main>
  );
}
