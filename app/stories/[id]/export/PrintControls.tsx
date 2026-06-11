"use client";

// Start: PrintControls Component
export function PrintControls() {
    return (
        <div className="no-print fixed top-4 right-4 bg-white/90 backdrop-blur border shadow-lg rounded-xl p-4 flex flex-col gap-3 z-50 max-w-xs">
            <div className="flex gap-2">
                <button
                    onClick={() => window.print()}
                    className="bg-black hover:bg-black/80 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                    Print / Save PDF
                </button>
                <button
                    onClick={() => window.close()}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-4 py-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                    Close Preview
                </button>
            </div>
            <div className="text-[10px] text-amber-850 bg-amber-50/90 border border-amber-200 rounded-lg p-2.5 leading-relaxed mt-1">
                <span className="font-semibold uppercase tracking-wider text-[9px] text-amber-600 block mb-1">Important for Clean PDF</span>
                In the browser print options, you <strong>must uncheck</strong> the <strong>&ldquo;Headers and footers&rdquo;</strong> setting to hide the date, URL, and browser title.
            </div>
        </div>
    );
}
// End: PrintControls Component
