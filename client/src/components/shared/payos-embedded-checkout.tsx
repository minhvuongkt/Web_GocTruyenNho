import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PayOSEmbeddedCheckoutProps {
  amount: number;
  description?: string;
  onSuccess: (orderCode: string) => void;
  onCancel?: () => void;
}

export function PayOSEmbeddedCheckout({
  amount,
  description = "Thanh toán dịch vụ",
  onSuccess,
  onCancel,
}: PayOSEmbeddedCheckoutProps) {
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Create payment link handler
  const handleGetPaymentLink = async () => {
    setIsCreatingLink(true);

    try {
      // Generate an order code based on timestamp
      const orderCode = `ORDER${Date.now().toString().slice(-6)}`;

      // Call the API to create a payment
      const response = await apiRequest("POST", "/api/payos/create-payment", {
        amount,
        orderCode,
        description,
        returnUrl: window.location.href,
        cancelUrl: window.location.href,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.desc || "Server không phản hồi");
      }

      const result = await response.json();

      // Check for valid response
      if (result.code !== "00" || !result.data || !result.data.checkoutUrl) {
        throw new Error(result.desc || "Không thể tạo link thanh toán");
      }

      // Store payment URL
      setPaymentUrl(result.data.checkoutUrl);
      setIsOpen(true);
    } catch (error: any) {
      toast({
        title: "Lỗi tạo thanh toán",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
      console.error("PayOS payment error:", error);
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Handle successful payment callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const paymentId = params.get("id") || params.get("orderCode");

    if (status === "success" && paymentId) {
      setMessage("Thanh toán thành công!");
      onSuccess(paymentId);
    } else if (status === "cancel") {
      if (onCancel) onCancel();
    }
  }, [onSuccess, onCancel]);

  // Handle cancel button
  const handleCancel = () => {
    setIsOpen(false);
    setPaymentUrl(null);
    if (onCancel) onCancel();
  };

  // Handle payment completion manually
  const handleConfirmPayment = () => {
    toast({
      title: "Đang xác nhận thanh toán",
      description: "Vui lòng đợi trong giây lát...",
    });

    // You would typically check the payment status with the server here
    // For simplicity, we'll just assume success after 2 seconds
    setTimeout(() => {
      setMessage("Thanh toán thành công!");
      onSuccess("manual-confirm");
    }, 2000);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {message ? (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-600 font-medium">{message}</p>
          <Button
            onClick={() => setMessage("")}
            variant="outline"
            className="mt-2"
          >
            Quay lại
          </Button>
        </div>
      ) : (
        <>
          {!isOpen ? (
            <div className="w-full">
              {isCreatingLink ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Đang tạo link thanh toán...</span>
                </div>
              ) : (
                <Button className="w-full" onClick={handleGetPaymentLink}>
                  Thanh toán qua PayOS
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full space-y-4">
              {paymentUrl && (
                <div className="w-full">
                  <iframe
                    src={paymentUrl}
                    className="w-full border border-gray-200 rounded-lg overflow-hidden"
                    style={{ height: "450px" }}
                    title="PayOS Checkout"
                  />

                  <div className="flex space-x-2 justify-between mt-4">
                    {/* <Button
                      variant="default"
                      onClick={handleConfirmPayment}
                    >
                      Tôi đã thanh toán
                    </Button> */}

                    <Button variant="destructive" onClick={handleCancel}>
                      Hủy thanh toán
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
