import { db } from "../../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { invoiceNumber, pdfBase64 } = req.body;

      const docRef = await addDoc(collection(db, "invoices"), {
        invoiceNumber,
        pdfBase64,
        createdAt: new Date(),
      });

      res.status(200).json({ message: "Stored", id: docRef.id });
    } catch (error) {
      res.status(500).json({ error: "Error storing data", details: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
