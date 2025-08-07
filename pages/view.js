// pages/view.js
import { useState, useEffect } from 'react';
import PDFDownload from './components/pdfdownload'; // adjust if needed

const ViewInvoice = ({ invoiceId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/fetchInvoice?invoiceId=${invoiceId}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          alert(json.error);
        }
      } catch (err) {
        console.error(err);
        alert("Error fetching invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No invoice data found.</p>;

  return <PDFDownload data={data} invoice={invoiceId} />;
};

export async function getServerSideProps(context) {
  const { invoiceId } = context.query;
  return { props: { invoiceId } };
}

export default ViewInvoice;
