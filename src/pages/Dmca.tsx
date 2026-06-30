import React from 'react';
import SEO from '../components/SEO';

export default function Dmca() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12">
      <SEO 
        title="DMCA - NexoraVid" 
        description="Digital Millennium Copyright Act (DMCA) Notice." 
        path="/dmca"
      />
      <h1 className="text-3xl font-bold mb-6">DMCA Notice</h1>
      <div className="prose prose-invert max-w-none text-slate-300">
        <p className="mb-4">Last updated: June 29, 2026</p>
        <p className="mb-4">NexoraVid respects the intellectual property of others. We take claims of copyright infringement seriously and will respond to notices of alleged copyright infringement that comply with applicable laws.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-white">Notice of Infringing Material</h2>
        <p className="mb-4">If you believe that your work has been copied in a way that constitutes copyright infringement, please provide our designated copyright agent with the following information:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.</li>
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material.</li>
          <li>Your contact information, including your address, telephone number, and an email address.</li>
          <li>A statement by you that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
          <li>A statement that the information in the notification is accurate, and, under penalty of perjury, that you are authorized to act on behalf of the copyright owner.</li>
        </ul>
        <p className="mb-4">You can send your DMCA notice to: <strong>dmca@nexoravid.com</strong></p>
      </div>
    </div>
  );
}
