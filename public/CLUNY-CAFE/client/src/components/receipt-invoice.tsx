import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import type { Order } from "@shared/schema";
import logoImage from "../assets/cluny-logo.png";
import { useRef, useState, useEffect } from "react";
import QRCode from "qrcode";

interface ReceiptInvoiceProps {
  order: Order;
  variant?: "button" | "auto";
}

export function ReceiptInvoice({ order, variant = "button" }: ReceiptInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [trackingQrUrl, setTrackingQrUrl] = useState<string>("");

  const getItemsArray = (): any[] => {
    try {
      if (!order || !order.items) return [];
      const items = order.items;
      if (Array.isArray(items)) return items;
      if (typeof items === 'string') {
        try {
          const parsed = JSON.parse(items);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      if (typeof items === 'object' && items !== null) {
        return Object.values(items);
      }
      return [];
    } catch (e) {
      console.error("Error parsing order items:", e, order?.items);
      return [];
    }
  };

  const items = getItemsArray();
  const safeOrder = order || {} as Order;

  useEffect(() => {
    const generateTrackingQR = async () => {
      if (!order || !order.orderNumber) return;
      try {
        const trackingUrl = `https://www.cluny.cafe/tracking?order=${order.orderNumber}`;
        const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setTrackingQrUrl(qrDataUrl);
      } catch (error) {
        console.error("Error generating tracking QR code:", error);
      }
    };
    generateTrackingQR();
  }, [order?.orderNumber]);

  // Early return if no valid order
  if (!order || !order.orderNumber) {
    return null;
  }

  const generatePDF = async () => {
    if (!invoiceRef.current) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`فاتورة-${order.orderNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const printReceipt = () => {
    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const style = `
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
              .receipt-container { width: 100%; max-width: 80mm; margin: 0 auto; font-family: sans-serif; }
              @page { size: 80mm auto; margin: 0; }
            }
          </style>
        `;
        
        // Preparation Slip (Kitchen)
        const prepSlip = `
          <div class="receipt-container" style="direction: rtl; padding: 10px; border-bottom: 2px dashed #000; margin-bottom: 20px;">
            <h2 style="text-align: center; margin: 5px 0;">طلب تحضير</h2>
            <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 10px 0;">
              #${order.orderNumber.includes('-') ? order.orderNumber.split('-').pop() : order.orderNumber}
            </div>
            <div style="border-top: 1px solid #000; padding-top: 10px;">
              ${items.map((item: any) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 16px; font-weight: bold;">
                  <span>${item.nameAr || item.name}</span>
                  <span>x${item.quantity}</span>
                </div>
              `).join('')}
            </div>
            ${order.customerNotes ? `
              <div style="margin-top: 10px; border: 1px solid #000; padding: 5px; font-size: 14px;">
                <strong>ملاحظات:</strong> ${order.customerNotes}
              </div>
            ` : ''}
            <div style="text-align: center; font-size: 12px; margin-top: 10px;">
              ${new Date(order.createdAt).toLocaleTimeString('ar-SA')}
            </div>
          </div>
        `;

        printWindow.document.write(`
          <html>
            <head>${style}</head>
            <body>
              <div class="receipt-container">
                ${invoiceRef.current.innerHTML}
                ${prepSlip}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Use a timeout to ensure styles and content are loaded before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  useEffect(() => {
    // Auto-print if variant is auto
    if (variant === "auto" && order && order.id) {
      const timer = setTimeout(() => {
        printReceipt();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [variant, order?.id]);

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'cash': 'نقداً',
      'pos': 'جهاز نقاط البيع',
      'delivery': 'الدفع عند التوصيل',
      'stc': 'STC Pay',
      'alinma': 'الإنماء باي',
      'ur': 'يور باي',
      'barq': 'برق',
      'rajhi': 'الراجحي',
      'qahwa-card': 'بطاقة قهوة'
    };
    return methods[method] || method;
  };

  // Early return if no valid order
  if (!order || !order.orderNumber) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Invoice Preview */}
      <div
        ref={invoiceRef}
        style={{ direction: "rtl" }}
        className="bg-white rounded-lg p-8 border border-primary/20 shadow-lg"
        data-testid="invoice-preview"
      >
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-primary/20">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Logo" className="h-20 w-20" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">فاتورة استلام</h1>
          <p className="text-gray-600 text-lg">متجر CLUNY CAFE</p>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-8 pb-6 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
            <p className="text-xl font-bold text-gray-800">{order.orderNumber.includes('-') ? order.orderNumber.split('-').pop() : order.orderNumber}</p>
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-1">التاريخ والوقت</p>
            <p className="text-lg font-semibold text-gray-800">
              {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        {order.customerInfo?.name && (
          <div className="mb-8 pb-6 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">اسم العميل</p>
                <p className="text-lg font-semibold text-gray-800">{order.customerInfo.name}</p>
              </div>
              {order.customerInfo.phone && (
                <div className="text-left">
                  <p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
                  <p className="text-lg font-semibold text-gray-800">{order.customerInfo.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-primary/20">تفاصيل الطلب</h3>
          <div className="space-y-3">
            {items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">{item.nameAr || item.name}</p>
                  <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">السعر: {parseFloat(item.price || 0).toFixed(2)} ريال</p>
                  <p className="font-bold text-primary text-lg">
                    {(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)} ريال
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <p className="text-sm text-gray-500 mb-2">طريقة الدفع</p>
          <p className="text-lg font-semibold text-gray-800">{getPaymentMethodName(order.paymentMethod)}</p>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-800">المجموع الكلي:</span>
            <span className="text-3xl font-bold text-primary">{Number(order.totalAmount).toFixed(2)} ريال</span>
          </div>
        </div>

        {/* Order Summary & Number for Kitchen/Staff */}
        <div className="mb-8 pt-6 border-t-2 border-dashed border-gray-300 text-center">
          <div className="bg-gray-100 rounded-lg p-4 inline-block min-w-[200px]">
            <p className="text-sm text-gray-500 mb-1">رقم الطلب (اختصار)</p>
            <p className="text-4xl font-black text-primary mb-3">
              #{order.orderNumber.includes('-') ? order.orderNumber.split('-').pop() : order.orderNumber}
            </p>
            <div className="text-right space-y-1">
              {items.map((item: any, idx: number) => (
                <p key={idx} className="text-sm font-bold text-gray-700">
                  {item.quantity} x {item.nameAr || item.name}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.customerNotes && (
          <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-800 mb-2">ملاحظات:</p>
            <p className="text-gray-700">{order.customerNotes}</p>
          </div>
        )}

        {/* Order Tracking QR Code */}
        {trackingQrUrl && (
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <p className="text-sm font-semibold text-primary mb-2">امسح لتتبع طلبك</p>
            <p className="text-xs text-gray-500 mb-3">Scan to Track Your Order</p>
            <div className="inline-block p-3 bg-white border-2 border-primary/20 rounded-lg">
              <img 
                src={trackingQrUrl} 
                alt="Order Tracking QR" 
                className="w-28 h-28 mx-auto"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              امسح الرمز للاطلاع على حالة طلبك
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200">
          <p className="text-lg font-semibold text-primary mb-2">شكراً لزيارتكم</p>
          <p className="text-gray-600">نتطلع لخدمتكم مرة أخرى</p>
        </div>
      </div>

      {/* Action Buttons */}
      {variant === "button" && (
        <div className="flex gap-2 w-full no-print">
          <Button
            onClick={printReceipt}
            className="flex-1 bg-primary hover:bg-primary/90"
            data-testid="button-print-invoice"
          >
            <Printer className="ml-2 h-4 w-4" />
            طباعة الفاتورة
          </Button>
          <Button
            onClick={generatePDF}
            variant="outline"
            className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300"
            data-testid="button-download-invoice"
          >
            <Download className="ml-2 h-4 w-4" />
            تحميل PDF
          </Button>
        </div>
      )}
    </div>
  );
}
