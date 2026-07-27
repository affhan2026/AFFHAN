"use client";

import { useState } from "react";
import Image from "next/image";
import { COUNTRIES } from "@/data/countries";

interface InquiryModalProps {
  product: any;
  onClose: () => void;
}

export function InquiryModal({ product, onClose }: InquiryModalProps) {
  const [inquiryForm, setInquiryForm] = useState({
    quantity: "1",
    name: "",
    country: "",
    phoneCode: "+Code",
    phoneNumber: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isPhoneCodeDropdownOpen, setIsPhoneCodeDropdownOpen] = useState(false);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product?.name || "Unknown Product",
          quantity: parseInt(inquiryForm.quantity) || 1,
          customerName: inquiryForm.name,
          country: inquiryForm.country,
          phone: `${inquiryForm.phoneCode} ${inquiryForm.phoneNumber}`.trim(),
        }),
      });

      if (response.ok) {
        // Stay on the confirmation until the user clicks "Done" — no auto-close.
        setSubmitted(true);
      } else {
        alert("Failed to submit inquiry. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error submitting inquiry.");
    }
  };

  if (!product) return null;

  // Polished full-panel confirmation shown after a successful submit.
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[timeline-fade-in_200ms_ease-out]">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 sm:p-10 text-center relative animate-[product-category-in_300ms_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="mx-auto relative w-20 h-20 mb-5">
            <span className="absolute inset-0 rounded-full bg-brand/10 animate-ping" />
            <span className="relative flex items-center justify-center w-20 h-20 rounded-full bg-brand/10 text-brand">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </span>
          </div>
          <h4 className="text-2xl font-black text-slate-900">Inquiry Submitted!</h4>
          <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Thank you — our sourcing team has received your request for<br />
            <span className="font-semibold text-slate-700">&quot;{product.name}&quot;</span> and will contact you shortly.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Reference saved to Affhan
          </div>
          <button onClick={onClose} className="mt-6 w-full rounded-xl bg-brand hover:bg-brand-dark py-3 text-sm font-bold text-white transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    // Overlay scrolls (not the card) so the tall stacked mobile layout is never
    // clipped: centered when it fits, top-aligned + scrollable when it doesn't.
    // Keeping overflow off the card means the country/phone dropdowns aren't
    // clipped either.
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 animate-[timeline-fade-in_200ms_ease-out]">
      <div className="flex min-h-full items-center justify-center">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col md:flex-row relative animate-[product-category-in_300ms_cubic-bezier(0.16,1,0.3,1)_both]">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Side: Logo + selected product preview */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-slate-50 to-white p-8 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-slate-100 rounded-t-2xl md:rounded-t-none md:rounded-l-2xl">
          <div className="relative h-8 w-24 self-center md:self-start mb-6">
            <Image src="/logo.png" alt="Affhan" fill className="object-contain object-left" />
          </div>
          {/* Product the user selected — so they know exactly what they're requesting */}
          <div className="relative w-full max-w-[220px] aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm mb-4">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill sizes="220px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">No Image</div>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand">
            {product.categoryRef?.name || product.category || "Product"}
          </span>
          <h3 className="mt-1 text-lg font-extrabold text-[#2a4e6c] leading-snug line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-3 text-xs text-slate-500 font-medium max-w-[260px]">
            Request a quote — our sourcing team will get this for you.
          </p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-10 bg-white rounded-b-2xl md:rounded-b-none md:rounded-r-2xl">
          {submitted ? (
            /* Success Animation */
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-500 border border-teal-100 shadow-sm mb-4">
                <svg className="h-8 w-8 animate-[timeline-pulse_1.5s_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-extrabold text-[#2a4e6c]">Inquiry Submitted!</h4>
              <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
                We will get back to you shortly.
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              
              {/* Quantity */}
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-slate-400">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="block w-full h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-[#336888] focus:ring-1 focus:ring-[#336888] focus:outline-none transition-colors"
                  value={inquiryForm.quantity}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, quantity: e.target.value })}
                />
              </div>

              {/* Name */}
              <div className="relative mt-5">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-slate-400">Name</label>
                <input
                  type="text"
                  required
                  className="block w-full h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-[#336888] focus:ring-1 focus:ring-[#336888] focus:outline-none transition-colors"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                />
              </div>

              {/* Country - Custom Dropdown */}
              <div className="relative mt-5">
                <label className="absolute -top-2 left-3 z-10 bg-white px-1 text-[10px] text-slate-400">Country</label>
                
                <div 
                  className="block w-full h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 cursor-pointer flex items-center justify-between"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                >
                  {inquiryForm.country ? (
                    <div className="flex items-center gap-2">
                      <Image 
                        src={`https://flagcdn.com/w20/${COUNTRIES.find(c => c.name === inquiryForm.country)?.code}.png`} 
                        alt="flag" 
                        width={20}
                        height={15}
                        className="w-5 h-auto rounded-sm object-cover" 
                      />
                      <span>{inquiryForm.country}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Select your country</span>
                  )}
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>

                {isCountryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                    {COUNTRIES.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors"
                        onClick={() => {
                          setInquiryForm({ 
                            ...inquiryForm, 
                            country: c.name,
                            phoneCode: c.dialCode 
                          });
                          setIsCountryDropdownOpen(false);
                        }}
                      >
                        <Image src={`https://flagcdn.com/w20/${c.code}.png`} alt={c.name} width={20} height={15} className="w-5 h-auto rounded-sm shadow-sm" />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="flex gap-3 mt-5">
                <div className="relative w-1/3">
                  <div 
                    className="block w-full h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 cursor-pointer flex items-center justify-between"
                    onClick={() => setIsPhoneCodeDropdownOpen(!isPhoneCodeDropdownOpen)}
                  >
                    <span>{inquiryForm.phoneCode}</span>
                    <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>

                  {isPhoneCodeDropdownOpen && (
                    <div className="absolute z-50 w-[150px] mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto left-0" style={{ scrollbarWidth: "thin" }}>
                      <div
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors"
                        onClick={() => {
                          setInquiryForm({ ...inquiryForm, phoneCode: "+Code" });
                          setIsPhoneCodeDropdownOpen(false);
                        }}
                      >
                        +Code
                      </div>
                      {Array.from(new Set(COUNTRIES.map(c => c.dialCode))).sort((a, b) => Number(a.replace('+', '')) - Number(b.replace('+', ''))).map(code => (
                        <div
                          key={code}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 transition-colors"
                          onClick={() => {
                            setInquiryForm({ ...inquiryForm, phoneCode: code });
                            setIsPhoneCodeDropdownOpen(false);
                          }}
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative w-2/3">
                  <input
                    type="tel"
                    required
                    placeholder="Phone number"
                    className="block w-full h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-[#336888] focus:ring-1 focus:ring-[#336888] focus:outline-none transition-colors"
                    value={inquiryForm.phoneNumber}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phoneNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#336888] hover:bg-[#2a5670] py-3 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  Submit Inquiry
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
    </div>
  );
}
