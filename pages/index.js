import { Accordion, AccordionItem } from "@heroui/accordion";


import { useEffect, useState } from "react";
import PDFDownload from "./components/pdfdownload";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import { doc, serverTimestamp, setDoc, where } from "firebase/firestore";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import LastUploadedFile from "./components/lastUploadedFile";
import confetti from "canvas-confetti";
import { motion } from 'framer-motion';
import { LoaderIcon, RotateCw } from "lucide-react";
import Image from "next/image";
import AnimatedBackground from "./components/AnimatedBg";


export default function Home() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [status, setStatus] = useState("");


  const [lastPdf, setLastPdf] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const [pdfSample, setPDFample] = useState(null);


  const fetchPDFfromStorage = async () => {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, "sample/Sample.pdf"); // folder/sample/Sample.pdf
      const url = await getDownloadURL(fileRef);

      console.log("PDF URL:", url);
      setPDFample(url);
    } catch (error) {
      console.error("Error fetching PDF:", error);
    }
  };


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
    // Runs only once when component mounts
    fetchPDFfromStorage();
  }, []);

  useEffect(() => { 
    fetchLastPdf();
  }, [details, lastPdf]);




  const defaultContent = (
    <div className="flex justify-center items-center" >
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">


        <h2 className="text-lg font-semibold mb-2">Welcome to the Amazon Invoice Tax Generator!</h2>
        <p className="text-gray-700 mb-2">
          This tool helps you extract essential tax details from your Amazon invoice PDFs and generates a ready-to-use tax invoice.
        </p>
        <ul className="list-disc list-inside text-gray-700">
          <li>Upload your Amazon Packaging Slip Invoice. 
            {pdfSample && (
              <a
                href={pdfSample}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mx-2  inline-block cursor-pointer"
              >
                View Sample PDF
              </a>)}
          </li>
          <li>Automatically extracts Order ID, Customer, Address, Invoice No, Date, Items, Qty & Price.</li>
          <li>Generates a professional tax invoice in PDF format.</li>
          <li>Free to use and easy to operate!</li>

        </ul>
        <p className="text-gray-700 mt-2">
          Simply enter your invoice number, upload the PDF, and let the tool do the rest!
        </p>
      </div>
      <div>
        <Image width={200} height={100} src="/amazon.gif" alt="signature" />
      </div>


    </div>
  );




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
    <div className="flex flex-col min-h-screen relative"> 


      <AnimatedBackground />
      <div className=" space-y-10  ">

        <h1 className="text-2xl text-center font-bold bg-blue-500 text-white uppercase p-5">Amazon Tax Invoice Generator</h1>




        <form onSubmit={handleUpload} className="text-gray-600 body-font">
          <div className="container mx-auto">

            <div className="flex lg:w-2/3 w-full sm:flex-row flex-col mx-auto px-8 sm:space-x-4 sm:space-y-0 space-y-4 sm:px-0 items-end">
              <div className="relative flex-grow w-full">
                <label htmlFor="invoice" className="leading-7 text-sm text-gray-600">Enter the Invoice/Document Number</label>
    ( {lastPdf ? (`${parseInt(lastPdf.invoiceNumber) + 1}`) : ('2100')} )
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

            <div className="max-w-5xl mx-auto mt-5 ">
              <Accordion variant="splitted" className="max-w-5xl mx-auto mt-5 cursor-pointer">
                <AccordionItem key="1" aria-label="Accordion 1" title="How to use this tool?" className="border border-gray-300 rounded-lg"   >
                  {defaultContent}
                </AccordionItem>
              </Accordion>
            </div>


          </div>



        </form>


        {/* LAST PDF LISTS */}
        {lastPdf ? (
          <div>
            <LastUploadedFile lastPdf={lastPdf} onExtractedDetails={handleExtractedDetails} />
          </div>

        ) : (
          <div className="max-w-7xl mx-auto">
            <p className="text-gray-500 text-center">No invoices uploaded to the Firbase🔥 yet.</p>
          </div>
        )}


       {loading && (

          <div className="mt-5 flex justify-center items-center">
            {`Generating PDF`}
            <LoaderIcon className={`ml-2 inline-block animate-spin `} />
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



      <div className={details || selectedPdf ? ("pt-0") : ("pt-74")}>
          <footer className="bg-gray-200 border-t border-gray-300 relative bottom-0 w-full">
            <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-600">
              <p>&copy; {new Date().getFullYear()} Made by Rahul - <a href="https://rahuldxb.com" target="_blank">rahuldxb.com</a></p>
            </div>
          </footer>  
      </div>  



      </div>

    </div>
  );
}
