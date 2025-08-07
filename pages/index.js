import { useState } from "react";
import PDFDownload from "./components/pdfdownload";

export default function Home() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.pdf.files[0];
    if (!file) return alert("Please select a PDF");

    const formData = new FormData();
    formData.append("pdf", file);

    setLoading(true);
    const res = await fetch("/api/extract", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setDetails(data);
    setLoading(false);
  };

  return (
    <div className=" space-y-10">
      <h1 className="text-2xl text-center font-bold bg-blue-500 text-white uppercase p-5">Amazon Invoice Tax Generator</h1>
     

      <form onSubmit={handleUpload} className="text-gray-600 body-font">
        <div className="container mx-auto">

          <div className="flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end">
            <div className="relative flex-grow w-full">
              <label htmlFor="invoice" className="leading-7 text-sm text-gray-600">Enter the Invoice/Document Number</label>
              <input type="number" id="invoiceNo" name="invoiceNumber" className="w-full bg-gray-100 bg-opacity-50  rounded border border-gray-300 focus:border-indigo-500 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" placeholder="21250" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}  required />
            </div>
            <div className="relative flex-grow w-full">
              <label htmlFor="file" className="leading-7 text-sm text-gray-600">Upload the Amazon Invoice PDF</label>
              <input type="file" name="pdf" className="w-full bg-gray-100 bg-opacity-50 hover:bg-gray-300 rounded border border-gray-300 focus:border-indigo-500 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out cursor-pointer" accept="application/pdf" placeholder="Drop file here or click to upload" multiple required />

            </div>


            <button type="submit" className="text-white bg-blue-500 border-0 py-2 px-8 focus:outline-none hover:bg-blue-600 rounded text-lg cursor-pointer">{loading ? "Processing..." : "Submit"}</button>
          </div>
        </div>
      </form>







      {details && (
        <div className="m-10 text-wrap relative">

          <div className="container mx-auto px-4">
            <PDFDownload data={details} invoice={invoiceNumber} />
          </div>

        </div>
      )}



    </div>
  );
}
