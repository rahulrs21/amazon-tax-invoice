import { useEffect, useState } from "react";
import PDFDownload from "./components/pdfdownload";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import { doc, serverTimestamp, setDoc, where } from "firebase/firestore";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import LastUploadedFile from "./components/lastUploadedFile";
import confetti from "canvas-confetti";


export default function Home() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [status, setStatus] = useState("");


  const [lastPdf, setLastPdf] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const fetchLastPdf = async () => {
    const q = query(
      collection(db, "invoices"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      setLastPdf({
        invoiceNumber: docData.invoiceNumber,
        fileName: docData.fileName,
        createdAt: docData.createdAt?.toDate().toLocaleString() || "",
        pdfUrl: docData.pdfUrl,
      });
    }
  };



  useEffect(() => {
    fetchLastPdf();
  }, [details, lastPdf]);


  const handleExtractedDetails = (data) => {
    setSelectedPdf(data);
     
  };



  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.pdf.files[0];
    if (!file) return alert("Please select a PDF");

    setLoading(true);


    // Check if invoiceNumber already exists
    const q = query(
      collection(db, "invoices"),
      where("invoiceNumber", "==", invoiceNumber)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setLoading(false);
      alert("Invoice number is already there. Please use a unique invoice number.");
      return;
    }

    // 1. Upload to Firebase Storage
    const storageRef = ref(storage, `invoices/${file.name}`);
    await uploadBytes(storageRef, file);
    const pdfUrl = await getDownloadURL(storageRef);
    console.log("PDF URL:", pdfUrl);


    // 2. Save metadata in Firestore
    const invoiceData = {
      invoiceNumber: invoiceNumber,
      fileName: file.name,
      pdfUrl: pdfUrl,
      createdAt: serverTimestamp(), // Firebase server timestamp
    };

    await setDoc(doc(db, "invoices", file.name), invoiceData);
    console.log("Uploaded & saved:", invoiceData);




    // 3. Extract data from PDF (send pdfUrl to backend if needed)
    const formData = new FormData();
    formData.append("pdfUrl", pdfUrl);
    formData.append("invoiceNumber", invoiceNumber);

    const res = await fetch("/api/extract", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setDetails({ ...data, pdfUrl }); // Save pdfUrl with details
    setLoading(false);
    setStatus("✅Data extracted successfully!");


    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
      colors: ["#bb0000", "#ffffff", "#ffcc00", "#00bbff"]
    });

  };





  return (
    <div className=" space-y-10">
      <h1 className="text-2xl text-center font-bold bg-blue-500 text-white uppercase p-5">Amazon Invoice Tax Generator</h1>


      <form onSubmit={handleUpload} className="text-gray-600 body-font">
        <div className="container mx-auto">

          <div className="flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end">
            <div className="relative flex-grow w-full">
              <label htmlFor="invoice" className="leading-7 text-sm text-gray-600">Enter the Invoice/Document Number</label>
              <input type="number" id="invoiceNo" name="invoiceNumber" className="w-full bg-gray-100 bg-opacity-50  rounded border border-gray-300 focus:border-indigo-500 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" placeholder={lastPdf ? (`${parseInt(lastPdf.invoiceNumber) + 1} - This is your next Invoice Number`) : ('2100')} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required />
            </div>
            <div className="relative flex-grow w-full">
              <label htmlFor="file" className="leading-7 text-sm text-gray-600">Upload the Amazon Invoice PDF</label>
              <input type="file" name="pdf" className="w-full bg-gray-100 bg-opacity-50 hover:bg-gray-300 rounded border border-gray-300 focus:border-indigo-500 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out cursor-pointer" accept="application/pdf" placeholder="Drop file here or click to upload" multiple required />

            </div>


            <button type="submit" className="text-white bg-blue-500 border-0 py-2 px-8 focus:outline-none hover:bg-blue-600 rounded text-lg cursor-pointer">{loading ? "Processing..." : "Submit"}</button>
          </div>
          <div className="container relative">
            <p className=" font-medium absolute right-[33%]">{status}</p>
          </div>
        </div>
      </form>



      {lastPdf ? (
        <LastUploadedFile lastPdf={lastPdf} onExtractedDetails={handleExtractedDetails} />

      ) : (
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-500 text-center">No invoices uploaded to the Firbase🔥 yet.</p>
        </div>
      )}





      {details ? (
        <div className="text-wrap relative">

          <div className="container mx-auto px-4 mb-5">
            <PDFDownload data={details} invoice={invoiceNumber} />
          </div>

        </div>
      ) : (
        <>

          {selectedPdf && (
            <div className="text-wrap relative">
              <div className="container mx-auto px-4 mb-5">
                <PDFDownload data={selectedPdf} invoice={lastPdf.invoiceNumber} />
              </div>
            </div>
          )}
        </>
      )}


    </div>
  );
}
