// pages/api/fetchInvoice.js
import { db } from '../../firebase/firebase'; // adjust if your firebase config path is different
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { invoiceId } = req.query;
  if (!invoiceId) return res.status(400).json({ error: 'Invoice ID is required' });

  try {
    const q = query(collection(db, "invoices"), where("invoiceId", "==", invoiceId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const data = snapshot.docs[0].data();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
