import multer from "multer";
import pdfParse from "pdf-parse";
import fs from "fs";

const upload = multer({ dest: "public/uploads" });

const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    await runMiddleware(req, res, upload.single("pdf"));

    const pdfPath = req.file.path;
    const dataBuffer = fs.readFileSync(pdfPath);

    try {
      const data = await pdfParse(dataBuffer);
      const text = data.text;

      // Extract Customer Name
      const customerMatch = text.match(/Ship To:\s*(.+)\n/i) || text.match(/Shipping Address:\s*(.+)\n/i);
      const customerName = customerMatch ? customerMatch[1].trim() : "Not Found";

      // Extract Order Number
      const orderMatch = text.match(/Order ID[:\s]+([0-9\-]+)/i);
      const orderNumber = orderMatch ? orderMatch[1].trim() : "Not Found";


      //   Extract Order Date
      const orderDateMatch = text.match(/([A-Za-z]{3},\s[A-Za-z]{3}\s\d{1,2},\s\d{4})/);
      const orderDate = orderDateMatch ? orderDateMatch[1].trim() : "Not Found";

      // Extract Address
      const addressMatch = text.match(/Ship To:\s*([\s\S]*?)\nOrder ID:/i) || text.match(/Shipping Address:\s*([\s\S]*?)\nOrder Date:/i);
      const address = addressMatch ? addressMatch[1].replace(/\n/g, ", ").trim() : "Not Found";


      // Extract quantity from under the "Quantity" label 
      const quantityMatch = text.match(/Order Totals\s*\n\s*(\d+)/i);
      const quantityString = quantityMatch ? quantityMatch[1].trim() : "Not Found";
      const quantity = parseInt(quantityString.replace(/[^0-9.]/g, '')) ;
     






      // Extract product name from under the "Product Details" label, stopping at "SKU:"
      const productMatch = text.match(
        /Order Totals\s*\d+\s*([\s\S]*?)\s*SKU\s*:/i
      );

      const productName = productMatch ? productMatch[1].trim().replace(/\s*\r?\n\s*/g, " ") : "Not Found";




      // Extract Price
      const priceMatch = text.match(/Grand total[:\s]+([A-Z]+\s*[0-9\.,]+)/i) || text.match(/COD Collectible Amount[:\s]+([A-Z]+\s*[0-9\.,]+)/i) || text.match(/Item total[:\s]+([A-Z]+\s*[0-9\.,]+)/i);
      const price = priceMatch ? priceMatch[1].trim() : "Not Found";


      const totalPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      
      
      const vatValue = ((totalPrice * 0.05).toFixed(2));
      
      const unitPrice = ((totalPrice / quantity)).toFixed(2);

      const subTotal = ((unitPrice * quantity) - vatValue).toFixed(2)


      // Delete temp file
      fs.unlinkSync(pdfPath);


      res.status(200).json({
        customerName,
        orderNumber,
        orderDate,
        address,
        productName,
        quantity,
        price,
        unitPrice,
        vatValue,
        subTotal
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to process PDF", details: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
